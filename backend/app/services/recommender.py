"""Recommendation generation: forecast demand, then optimise redistribution.

This is the decision core, but the AI is strictly *decision-support*: it only
ever emits an explainable **draft** proposal (``awaiting_verification``). Humans
verify, approve, and execute. Each proposal carries buffer-after-transfer,
predicted stockout date, a data-confidence rating, an assigned logistics model,
and an escalation level.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.ml import forecasting
from app.models import (
    DISTRICT_STORE_ID, Medicine, PHC, Recommendation, TransferEvent, UsageRecord,
)
from app.optimization import optimizer as opt
from app.services import analytics

HORIZON = 14
NEAR_EXPIRY_RETURN_DAYS = 30  # near-expiry surplus with no receiver -> return to store


def _usage_history(db: Session, phc_id: str, medicine_id: str) -> tuple[list[date], list[float]]:
    rows = db.execute(
        select(UsageRecord.usage_date, UsageRecord.used_qty)
        .where(UsageRecord.phc_id == phc_id, UsageRecord.medicine_id == medicine_id)
        .order_by(UsageRecord.usage_date)
    ).all()
    return [r[0] for r in rows], [float(r[1]) for r in rows]


def _forecast_demand(dates: list[date], usage: list[float]) -> float:
    if len(usage) < 8:
        recent = sum(usage[-7:]) / max(len(usage[-7:]), 1) if usage else 0.0
        return recent * HORIZON
    result = forecasting.forecast_series(dates, usage, HORIZON)
    return sum(f["predicted"] for f in result.forecast)


def _distance_matrix(phcs: list[PHC]) -> dict[tuple[str, str], float]:
    from app.core.geo import haversine_km

    dist: dict[tuple[str, str], float] = {}
    for a in phcs:
        for b in phcs:
            if a.phc_id != b.phc_id:
                dist[(a.phc_id, b.phc_id)] = haversine_km(a.latitude, a.longitude, b.latitude, b.longitude)
    return dist


def generate_recommendations(db: Session, phc_id: str | None = None) -> list[Recommendation]:
    phcs = db.execute(select(PHC)).scalars().all()
    meds = db.execute(select(Medicine)).scalars().all()
    phc_by_id = {p.phc_id: p for p in phcs}
    dist = _distance_matrix(phcs)

    db.execute(delete(Recommendation).where(Recommendation.status == "awaiting_verification"))

    existing = db.execute(select(Recommendation.recommendation_id)).scalars().all()
    counter = max((int(r.split("-")[-1]) for r in existing if r.split("-")[-1].isdigit()), default=0) + 1

    new_recs: list[Recommendation] = []
    for med in meds:
        donors: list[opt.Donor] = []
        receivers: list[opt.Receiver] = []
        meta: dict[str, dict] = {}
        for phc in phcs:
            snap = analytics.latest_snapshot(db, phc.phc_id, med.medicine_id)
            if snap is None:
                continue
            dates, usage = _usage_history(db, phc.phc_id, med.medicine_id)
            demand = _forecast_demand(dates, usage)
            avg = analytics.avg_daily_usage(db, phc.phc_id, med.medicine_id)
            days_of_cover = snap.stock_qty / max(avg, 0.1)
            days_to_expiry = (snap.expiry_date - date.today()).days
            conf, conf_en, conf_hi = analytics.data_confidence(snap)
            net = snap.stock_qty - (demand + med.min_safety_stock)
            meta[phc.phc_id] = {
                "snap": snap, "avg": avg, "days_of_cover": days_of_cover,
                "days_to_expiry": days_to_expiry, "stock": snap.stock_qty, "net": net,
                "conf": conf, "conf_en": conf_en, "conf_hi": conf_hi,
            }
            if net >= max(10, 0.15 * med.min_safety_stock):
                donors.append(opt.Donor(phc.phc_id, float(net), days_to_expiry))
            elif net <= -5:
                urgency = max(0.0, min(1.0, 1 - days_of_cover / HORIZON))
                receivers.append(opt.Receiver(phc.phc_id, float(-net), urgency))

        transfers = opt.optimize(donors, receivers, dist)
        given: dict[str, int] = {}
        for t in transfers:
            given[t.source_phc_id] = given.get(t.source_phc_id, 0) + t.qty
            if phc_id and phc_id not in (t.source_phc_id, t.target_phc_id):
                continue
            rec = _build_redistribution(counter, t, med, phc_by_id, meta)
            db.add(rec)
            db.flush()
            db.add(TransferEvent(recommendation_id=rec.recommendation_id, event="created",
                                 actor="ai_engine", note="Draft transfer proposal generated."))
            new_recs.append(rec)
            counter += 1

        # return-to-store: near-expiry surplus with no local receiver
        for d in donors:
            leftover = d.surplus - given.get(d.phc_id, 0)
            if d.days_to_expiry <= NEAR_EXPIRY_RETURN_DAYS and leftover >= max(10, 0.15 * med.min_safety_stock):
                if phc_id and phc_id != d.phc_id:
                    continue
                rec = _build_return_to_store(counter, d.phc_id, int(leftover), med, phc_by_id, meta)
                db.add(rec)
                db.flush()
                db.add(TransferEvent(recommendation_id=rec.recommendation_id, event="created",
                                     actor="ai_engine", note="Return-to-store proposal generated."))
                new_recs.append(rec)
                counter += 1

    db.commit()
    for r in new_recs:
        db.refresh(r)
    return new_recs


def _urgency_label(score: float) -> str:
    if score >= 0.8:
        return "critical"
    if score >= 0.6:
        return "high"
    if score >= 0.4:
        return "medium"
    return "low"


def _logistics_and_escalation(receiver_dc: float, cold_chain: bool, distance: float,
                              critical: bool, qty: int) -> tuple[str, str, bool]:
    """Return (logistics_model, escalation_level, emergency)."""
    if receiver_dc <= 2:
        return "emergency_lateral", "emergency", True
    escalation = "supervisor" if receiver_dc <= 7 else "none"
    if cold_chain or distance > 40 or (critical and qty >= 150):
        return "hub_and_spoke", escalation, False
    return "piggyback", escalation, False


def _build_redistribution(idx, t: opt.Transfer, med: Medicine,
                          phc_by_id: dict[str, PHC], meta: dict) -> Recommendation:
    src, tgt = phc_by_id[t.source_phc_id], phc_by_id[t.target_phc_id]
    sm, tm = meta[t.source_phc_id], meta[t.target_phc_id]
    tgt_days = max(0, int(tm["days_of_cover"]))
    donor_expiry = sm["days_to_expiry"]
    snap = sm["snap"]

    buffer_after = round((sm["stock"] - t.qty) / max(sm["avg"], 0.1), 1)
    urgency_val = max(0.0, min(1.0, 1 - tm["days_of_cover"] / HORIZON))
    expiry_pressure = 1.0 if donor_expiry <= 45 else (0.6 if donor_expiry <= 75 else 0.3)
    dist_factor = 1 - min(t.distance_km / 60.0, 1.0)
    priority = round(0.6 * urgency_val + 0.25 * expiry_pressure + 0.15 * dist_factor, 2)

    logistics, escalation, emergency = _logistics_and_escalation(
        tm["days_of_cover"], med.cold_chain, t.distance_km, med.critical, t.qty)
    confidence = analytics.weaker_confidence(sm["conf"], tm["conf"])
    conf_en, conf_hi = _confidence_text(confidence, sm, tm)

    expiry_note_en = f" expiring in {donor_expiry} days" if donor_expiry <= 75 else ""
    expiry_note_hi = f" जो {donor_expiry} दिनों में समाप्त हो रहा है" if donor_expiry <= 75 else ""
    reason_en = (
        f"{tgt.name} is projected to run out of {med.name} in ~{tgt_days} days, while {src.name} "
        f"holds surplus stock{expiry_note_en} and will still retain a {buffer_after:.0f}-day buffer "
        f"after transferring {t.qty} {med.unit}.")
    reason_hi = (
        f"{tgt.name} में {med.name} लगभग {tgt_days} दिनों में समाप्त होने का अनुमान है, जबकि {src.name} "
        f"के पास अतिरिक्त स्टॉक है{expiry_note_hi} और {t.qty} {med.unit} भेजने के बाद भी "
        f"{buffer_after:.0f}-दिन का बफर रहेगा।")

    return Recommendation(
        recommendation_id=f"REC-{idx:03d}", transfer_type="redistribution",
        source_phc_id=t.source_phc_id, target_phc_id=t.target_phc_id, target_name=tgt.name,
        medicine_id=med.medicine_id, suggested_qty=t.qty,
        priority_score=priority, urgency=_urgency_label(priority), distance_km=t.distance_km,
        batch_no=snap.batch_no, expiry_date=snap.expiry_date,
        cold_chain=med.cold_chain, storage_condition=med.storage_condition,
        predicted_stockout_date=date.today() + timedelta(days=tgt_days),
        source_buffer_days_after=buffer_after,
        logistics_model=logistics, emergency=emergency, escalation_level=escalation,
        confidence=confidence, confidence_reason_en=conf_en, confidence_reason_hi=conf_hi,
        reason_en=reason_en, reason_hi=reason_hi,
        expected_benefit_en=f"Prevents a {med.name} stockout at {tgt.name} and avoids waste at {src.name}.",
        expected_benefit_hi=f"{tgt.name} पर {med.name} की कमी रोकता है और {src.name} पर बर्बादी टालता है।",
        status="awaiting_verification",
    )


def _build_return_to_store(idx, source_id: str, qty: int, med: Medicine,
                           phc_by_id: dict[str, PHC], meta: dict) -> Recommendation:
    src = phc_by_id[source_id]
    sm = meta[source_id]
    snap = sm["snap"]
    expiry = sm["days_to_expiry"]
    confidence = sm["conf"]
    conf_en, conf_hi = _confidence_text(confidence, sm, None)
    return Recommendation(
        recommendation_id=f"REC-{idx:03d}", transfer_type="return_to_store",
        source_phc_id=source_id, target_phc_id=DISTRICT_STORE_ID, target_name="Block/District Store",
        medicine_id=med.medicine_id, suggested_qty=qty,
        priority_score=round(0.5 + max(0.0, (30 - expiry) / 60.0), 2), urgency="medium",
        distance_km=0.0, batch_no=snap.batch_no, expiry_date=snap.expiry_date,
        cold_chain=med.cold_chain, storage_condition=med.storage_condition,
        predicted_stockout_date=None, source_buffer_days_after=0.0,
        logistics_model="return_to_store", emergency=False, escalation_level="district_officer",
        confidence=confidence, confidence_reason_en=conf_en, confidence_reason_hi=conf_hi,
        reason_en=(f"{src.name} holds {qty} {med.unit} of {med.name} expiring in {expiry} days with no "
                   f"nearby PHC in deficit. Return to the block/district store for reallocation."),
        reason_hi=(f"{src.name} के पास {med.name} की {qty} {med.unit} {expiry} दिनों में समाप्त हो रही है और "
                   f"कोई निकटवर्ती PHC कमी में नहीं है। पुनः आवंटन हेतु ब्लॉक/जिला स्टोर को लौटाएं।"),
        expected_benefit_en=f"Avoids expiry waste of {qty} {med.unit} at {src.name}.",
        expected_benefit_hi=f"{src.name} पर {qty} {med.unit} की समाप्ति बर्बादी टालता है।",
        status="awaiting_verification",
    )


def _confidence_text(level: str, sm: dict, tm: dict | None) -> tuple[str, str]:
    if level == "high":
        return ("Stock data verified and current.", "स्टॉक डेटा सत्यापित और वर्तमान।")
    weakest = sm if (tm is None or analytics._CONF_RANK[sm["conf"]] <= analytics._CONF_RANK[tm["conf"]]) else tm
    prefix_en = "Physical verification required before approval. "
    prefix_hi = "स्वीकृति से पहले भौतिक सत्यापन आवश्यक। "
    return (prefix_en + weakest["conf_en"], prefix_hi + weakest["conf_hi"])
