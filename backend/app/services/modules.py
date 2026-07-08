"""Shaping logic for the operational modules: beds, footfall, doctors, tests."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Bed, Doctor, FootfallRecord, PHC, TestAvailability


def _phc_name(db: Session, phc_id: str) -> str:
    return db.get(PHC, phc_id).name if db.get(PHC, phc_id) else phc_id


def bed_status(occupancy: float) -> str:
    if occupancy >= 0.9:
        return "critical"
    if occupancy >= 0.75:
        return "warning"
    return "healthy"


def beds(db: Session, phc_id: str | None = None) -> list[dict]:
    stmt = select(Bed)
    if phc_id:
        stmt = stmt.where(Bed.phc_id == phc_id)
    out = []
    for b in db.execute(stmt).scalars().all():
        total = b.general_total + b.icu_total + b.maternity_total
        occ = b.general_occupied + b.icu_occupied + b.maternity_occupied
        rate = round(occ / total, 2) if total else 0.0
        out.append({
            "phc_id": b.phc_id, "phc_name": _phc_name(db, b.phc_id),
            "total_beds": total, "occupied_beds": occ, "available_beds": total - occ,
            "general": {"total": b.general_total, "occupied": b.general_occupied},
            "icu": {"total": b.icu_total, "occupied": b.icu_occupied},
            "maternity": {"total": b.maternity_total, "occupied": b.maternity_occupied},
            "occupancy_rate": rate, "status": bed_status(rate),
            "updated_at": b.updated_at.isoformat(),
        })
    return out


def footfall(db: Session, phc_id: str | None = None, days: int = 14) -> dict:
    since = date.today() - timedelta(days=days)
    stmt = select(
        FootfallRecord.record_date,
        func.sum(FootfallRecord.opd), func.sum(FootfallRecord.ipd), func.sum(FootfallRecord.emergency),
    ).where(FootfallRecord.record_date >= since).group_by(FootfallRecord.record_date)
    if phc_id:
        stmt = stmt.where(FootfallRecord.phc_id == phc_id)
    rows = db.execute(stmt.order_by(FootfallRecord.record_date)).all()
    series = [{"date": r[0].isoformat(), "opd": int(r[1]), "ipd": int(r[2]),
               "emergency": int(r[3]), "total": int(r[1] + r[2] + r[3])} for r in rows]
    today_row = series[-1] if series else {"opd": 0, "ipd": 0, "emergency": 0, "total": 0}
    avg = round(sum(s["total"] for s in series) / len(series), 1) if series else 0.0
    result = {
        "phc_id": phc_id,
        "today": {k: today_row[k] for k in ("opd", "ipd", "emergency", "total")},
        "series": series, "avg_daily": avg, "peak_hour": "10:00-11:00",
    }
    if not phc_id:
        by_phc = db.execute(
            select(FootfallRecord.phc_id,
                   func.sum(FootfallRecord.opd + FootfallRecord.ipd + FootfallRecord.emergency))
            .where(FootfallRecord.record_date == (rows[-1][0] if rows else since))
            .group_by(FootfallRecord.phc_id)
        ).all()
        result["by_phc"] = [{"phc_id": r[0], "phc_name": _phc_name(db, r[0]), "total": int(r[1])}
                            for r in by_phc]
    return result


def doctors(db: Session, phc_id: str | None = None) -> list[dict]:
    stmt = select(Doctor)
    if phc_id:
        stmt = stmt.where(Doctor.phc_id == phc_id)
    return [{
        "phc_id": d.phc_id, "phc_name": _phc_name(db, d.phc_id),
        "doctor_name": d.name, "specialty": d.specialty,
        "status": d.status, "expected": d.expected, "since": d.since.isoformat(),
    } for d in db.execute(stmt).scalars().all()]


def doctors_summary(db: Session, phc_id: str | None = None) -> dict:
    docs = doctors(db, phc_id)
    present = sum(1 for d in docs if d["status"] == "present")
    absent = sum(1 for d in docs if d["status"] == "absent")
    on_leave = sum(1 for d in docs if d["status"] == "on_leave")
    expected = sum(1 for d in docs if d["expected"])
    return {"present": present, "absent": absent, "on_leave": on_leave, "expected": expected,
            "attendance_rate": round(present / expected, 2) if expected else 0.0}


def tests(db: Session, phc_id: str | None = None, available: bool | None = None) -> list[dict]:
    stmt = select(TestAvailability)
    if phc_id:
        stmt = stmt.where(TestAvailability.phc_id == phc_id)
    if available is not None:
        stmt = stmt.where(TestAvailability.available == available)
    return [{
        "phc_id": t.phc_id, "phc_name": _phc_name(db, t.phc_id),
        "test_name": t.test_name, "category": t.category, "available": t.available,
        "reason_en": t.reason_en, "reason_hi": t.reason_hi,
        "updated_at": t.updated_at.isoformat(),
    } for t in db.execute(stmt).scalars().all()]
