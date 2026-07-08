"""Master data: PHCs, medicines, i18n dictionary."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.i18n import UI_STRINGS
from app.models import Medicine, PHC

router = APIRouter(prefix="/api", tags=["master"])


def _phc_dict(p: PHC) -> dict:
    return {"phc_id": p.phc_id, "name": p.name, "type": p.type, "block": p.block,
            "district": p.district, "latitude": p.latitude, "longitude": p.longitude,
            "catchment_population": p.catchment_population, "priority_level": p.priority_level,
            "digital_maturity": p.digital_maturity}


@router.get("/phcs")
def list_phcs(district: str | None = None, block: str | None = None,
              type: str | None = None, db: Session = Depends(get_db)) -> list[dict]:
    stmt = select(PHC)
    if district:
        stmt = stmt.where(PHC.district == district)
    if block:
        stmt = stmt.where(PHC.block == block)
    if type:
        stmt = stmt.where(PHC.type == type)
    return [_phc_dict(p) for p in db.execute(stmt).scalars().all()]


@router.get("/phcs/{phc_id}")
def get_phc(phc_id: str, db: Session = Depends(get_db)) -> dict:
    p = db.get(PHC, phc_id)
    if not p:
        raise HTTPException(status_code=404, detail="PHC not found")
    return _phc_dict(p)


@router.get("/medicines")
def list_medicines(db: Session = Depends(get_db)) -> list[dict]:
    meds = db.execute(select(Medicine)).scalars().all()
    return [{"medicine_id": m.medicine_id, "name": m.name, "unit": m.unit,
             "category": m.category, "critical": m.critical,
             "min_safety_stock": m.min_safety_stock,
             "cold_chain": m.cold_chain, "storage_condition": m.storage_condition} for m in meds]


@router.get("/meta/i18n")
def i18n() -> dict:
    return UI_STRINGS
