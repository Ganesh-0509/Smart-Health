"""Live alerts endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import insights

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
def list_alerts(phc_id: str | None = None, type: str | None = None,
                lang: str = "en", db: Session = Depends(get_db)) -> list[dict]:
    return insights.build_alerts(db, phc_id=phc_id, type_filter=type)
