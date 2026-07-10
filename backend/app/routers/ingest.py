"""Stock ingestion endpoints (mobile/SMS/CSV fallbacks)."""
# NOTE: no ``from __future__ import annotations`` here — the slowapi rate-limit
# decorator wraps these handlers, and FastAPI must see real (non-stringified)
# type annotations to resolve the request-body models through the wrapper.
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.ratelimit import limiter
from app.services import ingestion

router = APIRouter(prefix="/api/ingest", tags=["ingestion"])


class SmsBody(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    phc_id: str | None = Field(default=None, max_length=50)


class CsvBody(BaseModel):
    # Cap payload size to keep the parser (and memory) bounded on bulk uploads.
    csv: str = Field(min_length=1, max_length=200_000)


@router.post("/sms")
@limiter.limit("30/minute")
def ingest_sms(request: Request, body: SmsBody, db: Session = Depends(get_db)) -> dict:
    return ingestion.parse_sms(db, body.message, body.phc_id)


@router.post("/csv")
@limiter.limit("30/minute")
def ingest_csv(request: Request, body: CsvBody, db: Session = Depends(get_db)) -> dict:
    return ingestion.ingest_csv(db, body.csv)
