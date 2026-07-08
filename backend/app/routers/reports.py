"""Reports / analytics endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import insights

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/summary")
def summary(lang: str = "en", db: Session = Depends(get_db)) -> dict:
    return insights.reports_summary(db)
