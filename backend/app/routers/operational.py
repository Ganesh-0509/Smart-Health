"""Operational modules: beds, footfall, doctors, tests."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services import modules

router = APIRouter(prefix="/api", tags=["operational"])


@router.get("/beds")
def beds(phc_id: str | None = None, db: Session = Depends(get_db)) -> list[dict]:
    return modules.beds(db, phc_id)


@router.get("/footfall")
def footfall(phc_id: str | None = None, days: int = 14, db: Session = Depends(get_db)) -> dict:
    return modules.footfall(db, phc_id, days)


@router.get("/doctors")
def doctors(phc_id: str | None = None, db: Session = Depends(get_db)) -> list[dict]:
    return modules.doctors(db, phc_id)


@router.get("/doctors/summary")
def doctors_summary(phc_id: str | None = None, db: Session = Depends(get_db)) -> dict:
    return modules.doctors_summary(db, phc_id)


@router.get("/tests")
def tests(phc_id: str | None = None, available: bool | None = None,
          db: Session = Depends(get_db)) -> list[dict]:
    return modules.tests(db, phc_id, available)
