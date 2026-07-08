"""SQLAlchemy ORM models for Smart Health.

Covers the inventory/redistribution core plus the operational modules
(beds, footfall, doctor attendance, test availability) and the human-in-the-loop
transfer governance workflow (approval state machine + batch-level audit trail).
"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# Pseudo-node representing the block/district warehouse for return-to-store flows.
DISTRICT_STORE_ID = "STORE-DIST"


class PHC(Base):
    __tablename__ = "phcs"

    phc_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, default="PHC")  # PHC | CHC
    block: Mapped[str] = mapped_column(String, nullable=False)
    district: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    catchment_population: Mapped[int] = mapped_column(Integer, default=0)
    priority_level: Mapped[int] = mapped_column(Integer, default=3)  # 1=highest
    digital_maturity: Mapped[str] = mapped_column(String, default="app")  # app | smartphone | sms


class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    unit: Mapped[str] = mapped_column(String, default="unit")
    category: Mapped[str] = mapped_column(String, default="General")
    critical: Mapped[bool] = mapped_column(Boolean, default=False)
    min_safety_stock: Mapped[int] = mapped_column(Integer, default=50)
    cold_chain: Mapped[bool] = mapped_column(Boolean, default=False)
    storage_condition: Mapped[str] = mapped_column(String, default="Room temperature")


class InventorySnapshot(Base):
    __tablename__ = "inventory_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.phc_id"), index=True)
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.medicine_id"), index=True)
    stock_qty: Mapped[int] = mapped_column(Integer, default=0)
    batch_no: Mapped[str] = mapped_column(String, default="")
    expiry_date: Mapped[date] = mapped_column(Date)
    snapshot_date: Mapped[date] = mapped_column(Date, index=True)
    # how the stock figure was captured — drives data-confidence scoring
    updated_via: Mapped[str] = mapped_column(String, default="manual")  # barcode|manual|sms|csv|api


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.phc_id"), index=True)
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.medicine_id"), index=True)
    used_qty: Mapped[int] = mapped_column(Integer, default=0)
    usage_date: Mapped[date] = mapped_column(Date, index=True)


class Recommendation(Base):
    """An AI-generated, explainable transfer proposal.

    The AI only ever produces a *draft* (``awaiting_verification``). Every step
    beyond that is human-driven; the status walks the approval state machine.
    """

    __tablename__ = "recommendations"

    recommendation_id: Mapped[str] = mapped_column(String, primary_key=True)
    transfer_type: Mapped[str] = mapped_column(String, default="redistribution")  # redistribution|return_to_store
    source_phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.phc_id"))
    target_phc_id: Mapped[str | None] = mapped_column(String, nullable=True)  # null/STORE-DIST for return
    target_name: Mapped[str] = mapped_column(String, default="")
    medicine_id: Mapped[str] = mapped_column(ForeignKey("medicines.medicine_id"))
    suggested_qty: Mapped[int] = mapped_column(Integer, default=0)

    priority_score: Mapped[float] = mapped_column(Float, default=0.0)
    urgency: Mapped[str] = mapped_column(String, default="medium")
    distance_km: Mapped[float] = mapped_column(Float, default=0.0)

    # batch-level audit context
    batch_no: Mapped[str] = mapped_column(String, default="")
    expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    cold_chain: Mapped[bool] = mapped_column(Boolean, default=False)
    storage_condition: Mapped[str] = mapped_column(String, default="")

    # decision context
    predicted_stockout_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    source_buffer_days_after: Mapped[float] = mapped_column(Float, default=0.0)
    logistics_model: Mapped[str] = mapped_column(String, default="piggyback")
    emergency: Mapped[bool] = mapped_column(Boolean, default=False)
    escalation_level: Mapped[str] = mapped_column(String, default="none")  # none|supervisor|district_officer|emergency
    confidence: Mapped[str] = mapped_column(String, default="medium")  # high|medium|low|very_low
    confidence_reason_en: Mapped[str] = mapped_column(String, default="")
    confidence_reason_hi: Mapped[str] = mapped_column(String, default="")

    reason_en: Mapped[str] = mapped_column(String, default="")
    reason_hi: Mapped[str] = mapped_column(String, default="")
    expected_benefit_en: Mapped[str] = mapped_column(String, default="")
    expected_benefit_hi: Mapped[str] = mapped_column(String, default="")

    # workflow state + lifecycle audit fields
    status: Mapped[str] = mapped_column(String, default="awaiting_verification", index=True)
    verified_by: Mapped[str | None] = mapped_column(String, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verified_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actual_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pickup_by: Mapped[str | None] = mapped_column(String, nullable=True)
    picked_up_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    received_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    received_condition: Mapped[str | None] = mapped_column(String, nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    stock_updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reject_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    modify_reason: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TransferEvent(Base):
    """Immutable audit-trail entry for every action on a recommendation."""

    __tablename__ = "transfer_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recommendation_id: Mapped[str] = mapped_column(ForeignKey("recommendations.recommendation_id"), index=True)
    event: Mapped[str] = mapped_column(String)   # created|verified|approved|rejected|assigned|picked_up|confirmed|stock_updated|emergency_marked|returned_to_verification
    actor: Mapped[str] = mapped_column(String, default="system")
    note: Mapped[str] = mapped_column(String, default="")
    at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Bed(Base):
    __tablename__ = "beds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.phc_id"), unique=True, index=True)
    general_total: Mapped[int] = mapped_column(Integer, default=0)
    general_occupied: Mapped[int] = mapped_column(Integer, default=0)
    icu_total: Mapped[int] = mapped_column(Integer, default=0)
    icu_occupied: Mapped[int] = mapped_column(Integer, default=0)
    maternity_total: Mapped[int] = mapped_column(Integer, default=0)
    maternity_occupied: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class FootfallRecord(Base):
    __tablename__ = "footfall_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.phc_id"), index=True)
    record_date: Mapped[date] = mapped_column(Date, index=True)
    opd: Mapped[int] = mapped_column(Integer, default=0)
    ipd: Mapped[int] = mapped_column(Integer, default=0)
    emergency: Mapped[int] = mapped_column(Integer, default=0)


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.phc_id"), index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    specialty: Mapped[str] = mapped_column(String, default="General Medicine")
    status: Mapped[str] = mapped_column(String, default="present")  # present|absent|on_leave
    expected: Mapped[bool] = mapped_column(Boolean, default=True)
    since: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TestAvailability(Base):
    __tablename__ = "test_availability"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phc_id: Mapped[str] = mapped_column(ForeignKey("phcs.phc_id"), index=True)
    test_name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, default="Rapid Diagnostic")
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    reason_en: Mapped[str] = mapped_column(String, default="")
    reason_hi: Mapped[str] = mapped_column(String, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
