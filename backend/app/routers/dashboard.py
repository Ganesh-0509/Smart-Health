"""Dashboard summary endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import insights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(phc_id: str | None = None, lang: str = "en",
            db: Session = Depends(get_db)) -> dict:
    return insights.dashboard_summary(db, phc_id)


@router.get("/phc/{phc_id}")
def phc_summary(phc_id: str, lang: str = "en", db: Session = Depends(get_db)) -> dict:
    return insights.dashboard_summary(db, phc_id)
