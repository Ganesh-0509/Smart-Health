"""Cross-cutting insights: alerts, dashboard summary, district view, reports."""
from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import PHC, Recommendation, UsageRecord
from app.services import analytics, modules

# in-flight recommendation statuses (mirror of the router's state machine)
OPEN_STATUSES = ("awaiting_verification", "awaiting_approval", "approved", "assigned", "picked_up")
ACCEPTED_STATUSES = ("approved", "assigned", "picked_up", "stock_updated")

_AL = 0


def _alert_id() -> str:
    global _AL
    _AL += 1
    return f"AL-{_AL}"


def build_alerts(db: Session, phc_id: str | None = None,
                 type_filter: str | None = None) -> list[dict]:
    """Derive live alerts from current inventory / bed / doctor / test state."""
    global _AL
    _AL = 0
    alerts: list[dict] = []
    items = analytics.all_inventory(db, phc_id=phc_id)

    for it in items:
        if it["risk_level"] == "critical":
            alerts.append(_mk("shortage", "critical", it["phc_id"], it["phc_name"],
                              f"{it['medicine_name']} shortage imminent",
                              f"{it['medicine_name']} की कमी आसन्न",
                              f"Only {it['days_of_cover']} days of cover left.",
                              f"केवल {it['days_of_cover']} दिनों का स्टॉक शेष।"))
        if it["near_expiry"] and it["days_to_expiry"] <= 45:
            alerts.append(_mk("expiry", "warning", it["phc_id"], it["phc_name"],
                              f"{it['medicine_name']} nearing expiry",
                              f"{it['medicine_name']} समाप्ति के करीब",
                              f"Batch expires in {it['days_to_expiry']} days.",
                              f"बैच {it['days_to_expiry']} दिनों में समाप्त होगा।"))

    for b in modules.beds(db, phc_id):
        if b["status"] == "critical":
            alerts.append(_mk("bed_full", "critical", b["phc_id"], b["phc_name"],
                              "Beds nearly full",
                              "बेड लगभग भरे हुए",
                              f"Occupancy at {int(b['occupancy_rate']*100)}%.",
                              f"अधिभोग {int(b['occupancy_rate']*100)}% पर।"))

    for t in modules.tests(db, phc_id, available=False):
        alerts.append(_mk("test_down", "warning", t["phc_id"], t["phc_name"],
                          f"{t['test_name']} unavailable",
                          f"{t['test_name']} अनुपलब्ध",
                          t["reason_en"] or "Test currently unavailable.",
                          t["reason_hi"] or "जांच वर्तमान में अनुपलब्ध।"))

    # doctor gaps (per PHC)
    phcs = [phc_id] if phc_id else [p.phc_id for p in db.execute(select(PHC)).scalars().all()]
    for pid in phcs:
        summ = modules.doctors_summary(db, pid)
        if summ["expected"] and summ["attendance_rate"] < 0.6:
            p = db.get(PHC, pid)
            alerts.append(_mk("doctor_absent", "warning", pid, p.name if p else pid,
                              "Low doctor attendance",
                              "कम डॉक्टर उपस्थिति",
                              f"{summ['present']}/{summ['expected']} doctors present.",
                              f"{summ['present']}/{summ['expected']} डॉक्टर उपस्थित।"))

    if type_filter:
        alerts = [a for a in alerts if a["type"] == type_filter]
    order = {"critical": 0, "warning": 1, "healthy": 2}
    alerts.sort(key=lambda a: order.get(a["risk_level"], 3))
    return alerts


def _mk(type_, risk, phc_id, phc_name, ten, thi, men, mhi) -> dict:
    return {"id": _alert_id(), "type": type_, "risk_level": risk,
            "phc_id": phc_id, "phc_name": phc_name,
            "title_en": ten, "title_hi": thi, "message_en": men, "message_hi": mhi,
            "created_at": date.today().isoformat() + "T08:00:00Z"}


def demand_trend(db: Session, phc_id: str | None = None, days: int = 12) -> list[dict]:
    since = date.today() - timedelta(days=days)
    stmt = select(UsageRecord.usage_date, func.sum(UsageRecord.used_qty)).where(
        UsageRecord.usage_date >= since).group_by(UsageRecord.usage_date)
    if phc_id:
        stmt = stmt.where(UsageRecord.phc_id == phc_id)
    rows = db.execute(stmt.order_by(UsageRecord.usage_date)).all()
    actual = [int(r[1]) for r in rows]
    trend = []
    for i, r in enumerate(rows):
        window = actual[max(0, i - 6):i + 1]
        predicted = round(sum(window) / len(window)) if window else 0
        trend.append({"date": r[0].isoformat(), "actual": actual[i], "predicted": predicted})
    return trend


def dashboard_summary(db: Session, phc_id: str | None = None) -> dict:
    items = analytics.all_inventory(db, phc_id=phc_id)
    health = {"healthy": 0, "warning": 0, "critical": 0}
    for it in items:
        health[it["risk_level"]] += 1
    near_expiry = sum(1 for it in items if it["near_expiry"])

    bed_rows = modules.beds(db, phc_id)
    beds_total = sum(b["total_beds"] for b in bed_rows)
    beds_avail = sum(b["available_beds"] for b in bed_rows)
    doc = modules.doctors_summary(db, phc_id)
    ff = modules.footfall(db, phc_id, days=1)
    tests_down = len(modules.tests(db, phc_id, available=False))
    pending = db.execute(
        select(func.count()).select_from(Recommendation).where(Recommendation.status.in_(OPEN_STATUSES))
    ).scalar_one()
    alerts = build_alerts(db, phc_id)

    return {
        "scope": "phc" if phc_id else "district",
        "phc_id": phc_id,
        "kpis": {
            "items_at_shortage_risk": health["critical"],
            "items_near_expiry": near_expiry,
            "pending_recommendations": int(pending),
            "beds_available": beds_avail, "beds_total": beds_total,
            "doctors_present": doc["present"], "doctors_expected": doc["expected"],
            "footfall_today": ff["today"]["total"],
            "tests_unavailable": tests_down,
            "active_alerts": len(alerts),
        },
        "stock_health": health,
        "demand_trend": demand_trend(db, phc_id),
        "top_alerts": alerts[:5],
    }


def district_overview(db: Session) -> dict:
    from app.core.config import settings

    phcs = db.execute(select(PHC)).scalars().all()
    scores = []
    for phc in phcs:
        items = analytics.all_inventory(db, phc_id=phc.phc_id)
        stock_health = analytics.phc_health_score(items)
        stock_risk = round(1 - stock_health, 2)

        bed_rows = modules.beds(db, phc.phc_id)
        bed_pressure = round(max((b["occupancy_rate"] for b in bed_rows), default=0.0), 2)
        doc = modules.doctors_summary(db, phc.phc_id)
        doctor_gap = round(1 - doc["attendance_rate"], 2) if doc["expected"] else 0.0
        all_tests = modules.tests(db, phc.phc_id)
        down = sum(1 for t in all_tests if not t["available"])
        test_gap = round(down / len(all_tests), 2) if all_tests else 0.0

        health_score = round(
            1 - (0.4 * stock_risk + 0.25 * bed_pressure + 0.2 * doctor_gap + 0.15 * test_gap), 2)
        risk_level = "critical" if health_score < 0.5 else ("warning" if health_score < 0.7 else "healthy")
        flagged = health_score < 0.55 or stock_risk > 0.5 or bed_pressure > 0.85

        reasons_en, reasons_hi = [], []
        if stock_risk > 0.4:
            crit = sum(1 for it in items if it["risk_level"] == "critical")
            reasons_en.append(f"{crit} stockout risks")
            reasons_hi.append(f"{crit} स्टॉक जोखिम")
        if bed_pressure > 0.85:
            reasons_en.append("high bed pressure")
            reasons_hi.append("अधिक बेड दबाव")
        if doctor_gap > 0.4:
            reasons_en.append("doctor shortage")
            reasons_hi.append("डॉक्टर की कमी")
        if test_gap > 0.3:
            reasons_en.append(f"{down} tests down")
            reasons_hi.append(f"{down} टेस्ट बंद")

        scores.append({
            "phc_id": phc.phc_id, "name": phc.name, "type": phc.type,
            "latitude": phc.latitude, "longitude": phc.longitude,
            "health_score": health_score, "risk_level": risk_level,
            "stock_risk": stock_risk, "bed_pressure": bed_pressure,
            "doctor_gap": doctor_gap, "test_gap": test_gap,
            "flagged": flagged,
            "flag_reason_en": " + ".join(reasons_en) or "Operating normally",
            "flag_reason_hi": " + ".join(reasons_hi) or "सामान्य रूप से कार्यरत",
        })

    scores.sort(key=lambda s: s["health_score"])
    critical = sum(1 for s in scores if s["risk_level"] == "critical")
    avg = round(sum(s["health_score"] for s in scores) / len(scores), 2) if scores else 0.0
    return {
        "district": settings.district_name,
        "phc_scores": scores,
        "flagged_count": sum(1 for s in scores if s["flagged"]),
        "district_kpis": {"avg_health_score": avg, "total_phcs": len(scores), "critical_phcs": critical},
    }


def reports_summary(db: Session) -> dict:
    recs = db.execute(select(Recommendation)).scalars().all()
    accepted = [r for r in recs if r.status in ACCEPTED_STATUSES]
    completed = [r for r in recs if r.status == "stock_updated"]
    rejected = [r for r in recs if r.status == "rejected"]
    decided = accepted + rejected

    waste_avoided_units = sum(r.received_qty or r.actual_qty or r.suggested_qty for r in completed)
    stockouts_prevented = sum(1 for r in accepted if r.urgency in ("high", "critical"))
    completion = round(len(completed) / len(recs), 2) if recs else 0.0
    acceptance = round(len(accepted) / len(decided), 2) if decided else 0.0

    # risk rankings from live analytics
    items = analytics.all_inventory(db)
    med_risk: dict[str, list] = defaultdict(list)
    for it in items:
        risk = {"critical": 1.0, "warning": 0.5, "healthy": 0.1}[it["risk_level"]]
        med_risk[it["medicine_id"]].append((it["medicine_name"], risk))
    top_meds = sorted(
        ({"medicine_id": mid, "name": v[0][0],
          "risk_score": round(sum(x[1] for x in v) / len(v), 2)} for mid, v in med_risk.items()),
        key=lambda m: m["risk_score"], reverse=True)[:5]

    dist = district_overview(db)
    top_phcs = [{"phc_id": s["phc_id"], "name": s["name"], "health_score": s["health_score"]}
                for s in dist["phc_scores"][:5]]

    # simple 6-week trend from usage volatility (illustrative)
    trend = []
    base = date.today() - timedelta(weeks=6)
    for w in range(6):
        wk = base + timedelta(weeks=w)
        trend.append({"week": f"{wk.isocalendar().year}-W{wk.isocalendar().week:02d}",
                      "stockouts": max(0, 8 - w), "waste": max(0, 120 - w * 15)})

    return {
        "waste_avoided_units": waste_avoided_units,
        "waste_avoided_value": waste_avoided_units * 20,
        "stockouts_prevented": stockouts_prevented,
        "transfer_completion_rate": completion,
        "recommendation_acceptance_rate": acceptance,
        "top_risky_medicines": top_meds,
        "top_risky_phcs": top_phcs,
        "trend": trend,
    }
