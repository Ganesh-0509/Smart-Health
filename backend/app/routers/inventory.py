"""Inventory listing and risk endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import analytics

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("")
def list_inventory(phc_id: str | None = None, medicine_id: str | None = None,
                   risk_level: str | None = None, db: Session = Depends(get_db)) -> list[dict]:
    rows = analytics.all_inventory(db, phc_id=phc_id, medicine_id=medicine_id)
    if risk_level:
        rows = [r for r in rows if r["risk_level"] == risk_level]
    return rows


@router.get("/risk")
def inventory_risk(lang: str = "en", db: Session = Depends(get_db)) -> list[dict]:
    rows = [r for r in analytics.all_inventory(db)
            if r["risk_level"] != "healthy" or r["near_expiry"]]
    order = {"critical": 0, "warning": 1, "healthy": 2}
    for r in rows:
        if r["risk_level"] == "critical":
            r["reason_en"] = f"Only {r['days_of_cover']} days of cover; below safety stock."
            r["reason_hi"] = f"केवल {r['days_of_cover']} दिनों का स्टॉक; सुरक्षा स्तर से नीचे।"
        elif r["near_expiry"]:
            r["reason_en"] = f"Batch expires in {r['days_to_expiry']} days."
            r["reason_hi"] = f"बैच {r['days_to_expiry']} दिनों में समाप्त।"
        else:
            r["reason_en"] = f"{r['days_of_cover']} days of cover remaining."
            r["reason_hi"] = f"{r['days_of_cover']} दिनों का स्टॉक शेष।"
    rows.sort(key=lambda r: (order.get(r["risk_level"], 3), r["days_of_cover"]))
    return rows
