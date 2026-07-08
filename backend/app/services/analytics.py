"""Inventory analytics & risk scoring shared across endpoints."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import InventorySnapshot, Medicine, PHC, UsageRecord

NEAR_EXPIRY_DAYS = 60


def avg_daily_usage(db: Session, phc_id: str, medicine_id: str, days: int = 30) -> float:
    since = date.today() - timedelta(days=days)
    total = db.execute(
        select(func.coalesce(func.sum(UsageRecord.used_qty), 0)).where(
            UsageRecord.phc_id == phc_id,
            UsageRecord.medicine_id == medicine_id,
            UsageRecord.usage_date >= since,
        )
    ).scalar_one()
    return round(float(total) / days, 1)


def latest_snapshot(db: Session, phc_id: str, medicine_id: str) -> InventorySnapshot | None:
    return db.execute(
        select(InventorySnapshot)
        .where(InventorySnapshot.phc_id == phc_id, InventorySnapshot.medicine_id == medicine_id)
        .order_by(InventorySnapshot.snapshot_date.desc(), InventorySnapshot.id.desc())
    ).scalars().first()


def classify(stock: int, safety: int, days_of_cover: float) -> str:
    if stock < safety or days_of_cover < 5:
        return "critical"
    if days_of_cover < 12 or stock < safety * 1.3:
        return "warning"
    return "healthy"


def data_confidence(snap: InventorySnapshot) -> tuple[str, str, str]:
    """Confidence in a stock figure, from how and how recently it was captured.

    Returns (level, reason_en, reason_hi). Stale or unverified data must be
    physically re-verified before a transfer is approved.
    """
    age = (date.today() - snap.snapshot_date).days
    via = snap.updated_via
    if via in ("barcode", "api") and age <= 1:
        return ("high", "Updated today via barcode/system sync.",
                "आज बारकोड/सिस्टम सिंक से अपडेट किया गया।")
    if age <= 3:
        return ("medium", f"Updated {age} day(s) ago; manual entry.",
                f"{age} दिन पहले अपडेट; मैनुअल प्रविष्टि।")
    if age <= 10:
        return ("low", f"Stock last updated {age} days ago.",
                f"स्टॉक {age} दिन पहले अपडेट किया गया।")
    return ("very_low", f"Stale data — last updated {age} days ago.",
            f"पुराना डेटा — {age} दिन पहले अपडेट किया गया।")


_CONF_RANK = {"very_low": 0, "low": 1, "medium": 2, "high": 3}


def weaker_confidence(a: str, b: str) -> str:
    return a if _CONF_RANK[a] <= _CONF_RANK[b] else b


def analyse_item(db: Session, phc: PHC, med: Medicine, snap: InventorySnapshot | None) -> dict | None:
    if snap is None:
        return None
    usage = avg_daily_usage(db, phc.phc_id, med.medicine_id)
    days_of_cover = round(snap.stock_qty / max(usage, 0.1), 1)
    days_to_expiry = (snap.expiry_date - date.today()).days
    risk = classify(snap.stock_qty, med.min_safety_stock, days_of_cover)
    conf, conf_en, conf_hi = data_confidence(snap)
    return {
        "phc_id": phc.phc_id,
        "phc_name": phc.name,
        "medicine_id": med.medicine_id,
        "medicine_name": med.name,
        "stock_qty": snap.stock_qty,
        "min_safety_stock": med.min_safety_stock,
        "batch_no": snap.batch_no,
        "expiry_date": snap.expiry_date.isoformat(),
        "days_to_expiry": days_to_expiry,
        "snapshot_date": snap.snapshot_date.isoformat(),
        "avg_daily_usage": usage,
        "days_of_cover": days_of_cover,
        "risk_level": risk,
        "near_expiry": 0 <= days_to_expiry <= NEAR_EXPIRY_DAYS,
        "updated_via": snap.updated_via,
        "data_confidence": conf,
        "confidence_reason_en": conf_en,
        "confidence_reason_hi": conf_hi,
    }


def all_inventory(db: Session, phc_id: str | None = None,
                  medicine_id: str | None = None) -> list[dict]:
    phcs = db.execute(select(PHC)).scalars().all()
    meds = db.execute(select(Medicine)).scalars().all()
    out: list[dict] = []
    for phc in phcs:
        if phc_id and phc.phc_id != phc_id:
            continue
        for med in meds:
            if medicine_id and med.medicine_id != medicine_id:
                continue
            row = analyse_item(db, phc, med, latest_snapshot(db, phc.phc_id, med.medicine_id))
            if row:
                out.append(row)
    return out


def phc_health_score(items: list[dict]) -> float:
    """0..1 stock-health score for a PHC (1 = all healthy)."""
    if not items:
        return 1.0
    weight = {"healthy": 1.0, "warning": 0.55, "critical": 0.1}
    return round(sum(weight[i["risk_level"]] for i in items) / len(items), 2)
