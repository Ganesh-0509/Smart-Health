"""Redistribution recommendations + human-in-the-loop approval state machine.

Flow:
  awaiting_verification --verify--> awaiting_approval --approve--> approved
    --assign--> assigned --pickup--> picked_up --confirm--> stock_updated
Any non-terminal state can be rejected (reason required). Emergencies fast-track.
Every transition writes an immutable TransferEvent to the audit trail.
"""
from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Body, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import (
    DISTRICT_STORE_ID, InventorySnapshot, Medicine, PHC, Recommendation, TransferEvent,
)
from app.services import analytics, recommender

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# in-flight (non-terminal) statuses
OPEN_STATUSES = ("awaiting_verification", "awaiting_approval", "approved", "assigned", "picked_up")
TERMINAL = ("stock_updated", "rejected")


# ---- request bodies -------------------------------------------------------------
class GenerateBody(BaseModel):
    phc_id: str | None = None


class VerifyBody(BaseModel):
    verified_by: str = "phc_pharmacist"
    confirmed_qty: int | None = None
    note: str = ""


class ApproveBody(BaseModel):
    approved_by: str = "block_manager"
    actual_qty: int | None = None
    modify_reason: str = ""


class RejectBody(BaseModel):
    rejected_by: str = "block_manager"
    reason: str = ""


class AssignBody(BaseModel):
    actor: str = "logistics"
    logistics_model: str | None = None


class PickupBody(BaseModel):
    pickup_by: str = "delivery_agent"


class ConfirmBody(BaseModel):
    received_by: str = "phc_pharmacist"
    received_qty: int | None = None
    received_condition: str = "good"


class ActorBody(BaseModel):
    actor: str = "district_officer"


# ---- serialization --------------------------------------------------------------
def _iso(dt: datetime | date | None) -> str | None:
    return dt.isoformat() if dt else None


def _serialize(db: Session, r: Recommendation) -> dict:
    src = db.get(PHC, r.source_phc_id)
    tgt = db.get(PHC, r.target_phc_id) if r.target_phc_id and r.target_phc_id != DISTRICT_STORE_ID else None
    med = db.get(Medicine, r.medicine_id)
    return {
        "recommendation_id": r.recommendation_id, "transfer_type": r.transfer_type,
        "source_phc_id": r.source_phc_id, "source_phc_name": src.name if src else r.source_phc_id,
        "target_phc_id": r.target_phc_id, "target_phc_name": (tgt.name if tgt else r.target_name),
        "medicine_id": r.medicine_id, "medicine_name": med.name if med else r.medicine_id,
        "unit": med.unit if med else "unit",
        "suggested_qty": r.suggested_qty, "urgency": r.urgency, "priority_score": r.priority_score,
        "distance_km": r.distance_km,
        "batch_no": r.batch_no, "expiry_date": _iso(r.expiry_date),
        "cold_chain": r.cold_chain, "storage_condition": r.storage_condition,
        "predicted_stockout_date": _iso(r.predicted_stockout_date),
        "source_buffer_days_after": r.source_buffer_days_after,
        "logistics_model": r.logistics_model, "emergency": r.emergency,
        "escalation_level": r.escalation_level,
        "confidence": r.confidence,
        "confidence_reason_en": r.confidence_reason_en, "confidence_reason_hi": r.confidence_reason_hi,
        "reason_en": r.reason_en, "reason_hi": r.reason_hi,
        "expected_benefit_en": r.expected_benefit_en, "expected_benefit_hi": r.expected_benefit_hi,
        "status": r.status,
        "verified_by": r.verified_by, "verified_at": _iso(r.verified_at), "verified_qty": r.verified_qty,
        "approved_by": r.approved_by, "approved_at": _iso(r.approved_at), "actual_qty": r.actual_qty,
        "assigned_at": _iso(r.assigned_at),
        "pickup_by": r.pickup_by, "picked_up_at": _iso(r.picked_up_at),
        "received_qty": r.received_qty, "received_condition": r.received_condition,
        "delivered_at": _iso(r.delivered_at), "stock_updated_at": _iso(r.stock_updated_at),
        "reject_reason": r.reject_reason, "modify_reason": r.modify_reason,
        "created_at": _iso(r.created_at) + "Z" if r.created_at else None,
    }


def _get(db: Session, rec_id: str) -> Recommendation:
    r = db.get(Recommendation, rec_id)
    if not r:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return r


def _require(r: Recommendation, allowed: tuple[str, ...]) -> None:
    if r.status not in allowed:
        raise HTTPException(status_code=409,
                            detail=f"Action not allowed from status '{r.status}'.")


def _log(db: Session, rec_id: str, event: str, actor: str, note: str = "") -> None:
    db.add(TransferEvent(recommendation_id=rec_id, event=event, actor=actor, note=note))


# ---- read + generate ------------------------------------------------------------
@router.get("")
def list_recommendations(status: str | None = None, phc_id: str | None = None,
                         transfer_type: str | None = None, lang: str = "en",
                         db: Session = Depends(get_db)) -> list[dict]:
    stmt = select(Recommendation)
    if status == "open":
        stmt = stmt.where(Recommendation.status.in_(OPEN_STATUSES))
    elif status:
        stmt = stmt.where(Recommendation.status == status)
    if transfer_type:
        stmt = stmt.where(Recommendation.transfer_type == transfer_type)
    recs = db.execute(stmt.order_by(Recommendation.priority_score.desc())).scalars().all()
    if phc_id:
        recs = [r for r in recs if phc_id in (r.source_phc_id, r.target_phc_id)]
    return [_serialize(db, r) for r in recs]


@router.get("/{rec_id}/timeline")
def timeline(rec_id: str, db: Session = Depends(get_db)) -> list[dict]:
    _get(db, rec_id)
    events = db.execute(
        select(TransferEvent).where(TransferEvent.recommendation_id == rec_id)
        .order_by(TransferEvent.at, TransferEvent.id)
    ).scalars().all()
    return [{"event": e.event, "actor": e.actor, "note": e.note, "at": _iso(e.at) + "Z"}
            for e in events]


@router.post("/generate")
def generate(body: GenerateBody = Body(default=GenerateBody()),
             db: Session = Depends(get_db)) -> list[dict]:
    recommender.generate_recommendations(db, body.phc_id)
    return list_recommendations(db=db)


# ---- state machine transitions --------------------------------------------------
@router.post("/{rec_id}/verify")
def verify(rec_id: str, body: VerifyBody = Body(default=VerifyBody()),
           db: Session = Depends(get_db)) -> dict:
    r = _get(db, rec_id)
    _require(r, ("awaiting_verification",))
    r.status = "awaiting_approval"
    r.verified_by = body.verified_by
    r.verified_at = datetime.utcnow()
    r.verified_qty = body.confirmed_qty if body.confirmed_qty is not None else r.suggested_qty
    _log(db, rec_id, "verified", body.verified_by,
         body.note or f"Physically verified {r.verified_qty} {r.storage_condition}.")
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.post("/{rec_id}/request-verification")
def request_verification(rec_id: str, body: ActorBody = Body(default=ActorBody()),
                         db: Session = Depends(get_db)) -> dict:
    r = _get(db, rec_id)
    _require(r, ("awaiting_approval",))
    r.status = "awaiting_verification"
    r.verified_by = None; r.verified_at = None
    _log(db, rec_id, "returned_to_verification", body.actor, "Sent back for physical re-verification.")
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.post("/{rec_id}/approve")
def approve(rec_id: str, body: ApproveBody = Body(default=ApproveBody()),
            db: Session = Depends(get_db)) -> dict:
    r = _get(db, rec_id)
    # emergencies may be approved straight from verification
    allowed = ("awaiting_approval",) if not r.emergency else ("awaiting_approval", "awaiting_verification")
    _require(r, allowed)
    r.status = "approved"
    r.approved_by = body.approved_by
    r.approved_at = datetime.utcnow()
    r.actual_qty = body.actual_qty if body.actual_qty is not None else (r.verified_qty or r.suggested_qty)
    note = f"Approved {r.actual_qty} {('(modified: ' + body.modify_reason + ')') if body.modify_reason else ''}"
    if body.modify_reason:
        r.modify_reason = body.modify_reason
    _log(db, rec_id, "approved", body.approved_by, note.strip())
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.post("/{rec_id}/reject")
def reject(rec_id: str, body: RejectBody = Body(default=RejectBody()),
           db: Session = Depends(get_db)) -> dict:
    r = _get(db, rec_id)
    if r.status in TERMINAL:
        raise HTTPException(status_code=409, detail=f"Already {r.status}.")
    if not body.reason.strip():
        raise HTTPException(status_code=400, detail="A rejection reason is required.")
    r.status = "rejected"
    r.reject_reason = body.reason
    _log(db, rec_id, "rejected", body.rejected_by, body.reason)
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.post("/{rec_id}/assign")
def assign(rec_id: str, body: AssignBody = Body(default=AssignBody()),
           db: Session = Depends(get_db)) -> dict:
    r = _get(db, rec_id)
    _require(r, ("approved",))
    r.status = "assigned"
    r.assigned_at = datetime.utcnow()
    if body.logistics_model:
        r.logistics_model = body.logistics_model
    _log(db, rec_id, "assigned", body.actor, f"Logistics: {r.logistics_model}.")
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.post("/{rec_id}/pickup")
def pickup(rec_id: str, body: PickupBody = Body(default=PickupBody()),
           db: Session = Depends(get_db)) -> dict:
    r = _get(db, rec_id)
    _require(r, ("assigned",))
    r.status = "picked_up"
    r.pickup_by = body.pickup_by
    r.picked_up_at = datetime.utcnow()
    _log(db, rec_id, "picked_up", body.pickup_by, "Stock picked up from source.")
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.post("/{rec_id}/confirm")
def confirm(rec_id: str, body: ConfirmBody = Body(default=ConfirmBody()),
            db: Session = Depends(get_db)) -> dict:
    """Receiver confirms delivery; stock is then updated at both ends and logged."""
    r = _get(db, rec_id)
    _require(r, ("picked_up",))
    qty = body.received_qty if body.received_qty is not None else (r.actual_qty or r.suggested_qty)
    r.received_qty = qty
    r.received_condition = body.received_condition
    r.delivered_at = datetime.utcnow()
    _apply_stock_update(db, r, qty)
    r.status = "stock_updated"
    r.stock_updated_at = datetime.utcnow()
    _log(db, rec_id, "confirmed", body.received_by,
         f"Received {qty} in {body.received_condition} condition.")
    _log(db, rec_id, "stock_updated", "system",
         f"Source -{qty}" + ("" if r.transfer_type == "return_to_store" else f", destination +{qty}."))
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.post("/{rec_id}/mark-emergency")
def mark_emergency(rec_id: str, body: ActorBody = Body(default=ActorBody()),
                   db: Session = Depends(get_db)) -> dict:
    r = _get(db, rec_id)
    if r.status in TERMINAL:
        raise HTTPException(status_code=409, detail=f"Already {r.status}.")
    r.emergency = True
    r.escalation_level = "emergency"
    if r.transfer_type == "redistribution":
        r.logistics_model = "emergency_lateral"
    _log(db, rec_id, "emergency_marked", body.actor, "Flagged as emergency; fast-track approval.")
    db.commit(); db.refresh(r)
    return _serialize(db, r)


@router.get("/{rec_id}/briefing")
def briefing(rec_id: str, db: Session = Depends(get_db)) -> dict:
    """AI supervisor briefing for a transfer (Gemini), with a deterministic fallback.

    Turns the transfer's raw numbers into a plain-language bilingual justification
    the approver can act on. Uses the recommendation's own reason fields when
    Gemini is unavailable, so it always returns something useful.
    """
    from app.services import gemini

    r = _get(db, rec_id)
    rec = _serialize(db, r)
    ai = gemini.briefing(rec)
    if ai:
        return {"recommendation_id": rec_id, **ai}
    # Deterministic fallback from existing bilingual reason + benefit fields.
    buf = rec.get("source_buffer_days_after")
    tail_en = f" Source keeps ~{buf} days of cover after transfer." if buf is not None else ""
    tail_hi = f" स्थानांतरण के बाद स्रोत के पास ~{buf} दिन का स्टॉक रहेगा।" if buf is not None else ""
    caution_en = " Verify physically before approval." if rec.get("confidence") != "high" else ""
    caution_hi = " स्वीकृति से पहले भौतिक सत्यापन करें।" if rec.get("confidence") != "high" else ""
    return {
        "recommendation_id": rec_id,
        "briefing_en": (rec.get("reason_en") or "") + tail_en + caution_en,
        "briefing_hi": (rec.get("reason_hi") or "") + tail_hi + caution_hi,
        "source": "fallback",
    }


def _apply_stock_update(db: Session, r: Recommendation, qty: int) -> None:
    """Write new snapshots reflecting the executed transfer (source--, dest++)."""
    src_snap = analytics.latest_snapshot(db, r.source_phc_id, r.medicine_id)
    if src_snap:
        db.add(InventorySnapshot(
            phc_id=r.source_phc_id, medicine_id=r.medicine_id,
            stock_qty=max(0, src_snap.stock_qty - qty), batch_no=src_snap.batch_no,
            expiry_date=src_snap.expiry_date, snapshot_date=date.today(), updated_via="api"))
    if r.transfer_type == "redistribution" and r.target_phc_id and r.target_phc_id != DISTRICT_STORE_ID:
        tgt_snap = analytics.latest_snapshot(db, r.target_phc_id, r.medicine_id)
        if tgt_snap:
            db.add(InventorySnapshot(
                phc_id=r.target_phc_id, medicine_id=r.medicine_id,
                stock_qty=tgt_snap.stock_qty + qty, batch_no=tgt_snap.batch_no,
                expiry_date=tgt_snap.expiry_date, snapshot_date=date.today(), updated_via="api"))
