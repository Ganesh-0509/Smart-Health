"""District intelligence endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import insights

router = APIRouter(prefix="/api/district", tags=["district"])


@router.get("/overview")
def overview(lang: str = "en", db: Session = Depends(get_db)) -> dict:
    return insights.district_overview(db)
