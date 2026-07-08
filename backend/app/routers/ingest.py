"""Stock ingestion endpoints (mobile/SMS/CSV fallbacks)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import ingestion

router = APIRouter(prefix="/api/ingest", tags=["ingestion"])


class SmsBody(BaseModel):
    message: str
    phc_id: str | None = None


class CsvBody(BaseModel):
    csv: str


@router.post("/sms")
def ingest_sms(body: SmsBody, db: Session = Depends(get_db)) -> dict:
    return ingestion.parse_sms(db, body.message, body.phc_id)


@router.post("/csv")
def ingest_csv(body: CsvBody, db: Session = Depends(get_db)) -> dict:
    return ingestion.ingest_csv(db, body.csv)
