"""Synthetic data generator for the Smart Health demo.

Creates a realistic district of PHCs/CHCs with 90 days of seasonal usage
history and deliberately engineered shortage / surplus / near-expiry scenarios
so that forecasting, optimization, alerts, and the district view all produce
meaningful output out of the box. Deterministic (fixed RNG seed).
"""
from __future__ import annotations

import math
import random
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    Bed, Doctor, FootfallRecord, InventorySnapshot, Medicine, PHC,
    TestAvailability, UsageRecord,
)

RNG = random.Random(42)
TODAY = date.today()
HISTORY_DAYS = 90

# ---- master definitions ---------------------------------------------------------

PHCS = [
    ("PHC-01", "Rampur PHC", "PHC", "Rampur", 28.81, 79.02, 32000, 2),
    ("PHC-02", "Kila PHC", "PHC", "Kila", 28.36, 79.41, 28000, 3),
    ("PHC-03", "Sadar CHC", "CHC", "Sadar", 28.35, 79.44, 68000, 1),
    ("PHC-04", "Bhojipura PHC", "PHC", "Bhojipura", 28.49, 79.55, 24000, 3),
    ("PHC-05", "Nawabganj CHC", "CHC", "Nawabganj", 28.53, 79.63, 61000, 1),
    ("PHC-06", "Faridpur PHC", "PHC", "Faridpur", 28.21, 79.53, 30000, 2),
    ("PHC-07", "Aonla PHC", "PHC", "Aonla", 28.27, 79.16, 26000, 3),
    ("PHC-08", "Mirganj CHC", "CHC", "Mirganj", 28.53, 79.20, 57000, 1),
]

# (id, name, unit, category, critical, safety, popularity 0..1, season, cold_chain, storage)
MEDICINES = [
    ("MED-01", "ORS Sachet", "sachet", "Oral Rehydration", True, 200, 0.9, "monsoon", False, "Room temperature"),
    ("MED-02", "Paracetamol 500mg", "tablet", "Analgesic", True, 400, 1.0, "fever", False, "Room temperature"),
    ("MED-03", "Amoxicillin 250mg", "capsule", "Antibiotic", True, 250, 0.7, "none", False, "Below 25°C, dry"),
    ("MED-04", "Iron Folic Acid", "tablet", "Supplement", False, 300, 0.6, "none", False, "Room temperature"),
    ("MED-05", "Metformin 500mg", "tablet", "Antidiabetic", True, 180, 0.5, "none", False, "Room temperature"),
    ("MED-06", "Amlodipine 5mg", "tablet", "Antihypertensive", True, 150, 0.5, "none", False, "Room temperature"),
    ("MED-07", "Chloroquine", "tablet", "Antimalarial", True, 120, 0.4, "monsoon", False, "Room temperature"),
    ("MED-08", "Cetirizine 10mg", "tablet", "Antihistamine", False, 160, 0.5, "none", False, "Room temperature"),
    ("MED-09", "ORS + Zinc Kit", "kit", "Oral Rehydration", True, 140, 0.6, "monsoon", False, "Room temperature"),
    ("MED-10", "Albendazole", "tablet", "Deworming", False, 130, 0.4, "none", False, "Room temperature"),
    ("MED-11", "Oxytocin Injection", "vial", "Maternal Health", True, 90, 0.4, "none", True, "2-8°C cold chain"),
    ("MED-12", "TT Vaccine", "dose", "Vaccine", True, 200, 0.6, "none", True, "2-8°C cold chain"),
    ("MED-13", "Salbutamol Inhaler", "unit", "Respiratory", True, 80, 0.3, "winter", False, "Below 30°C"),
    ("MED-14", "Cough Syrup", "bottle", "Respiratory", False, 220, 0.7, "winter", False, "Room temperature"),
    ("MED-15", "Vitamin A", "dose", "Supplement", False, 110, 0.3, "none", False, "Protect from light"),
]

# per-PHC digital maturity (drives the low-connectivity / ingestion narrative)
MATURITY = ["app", "app", "app", "smartphone", "app", "sms", "smartphone", "app"]

DOCTOR_NAMES = [
    "Dr. A. Sharma", "Dr. R. Verma", "Dr. S. Gupta", "Dr. M. Khan", "Dr. P. Singh",
    "Dr. N. Reddy", "Dr. K. Iyer", "Dr. J. Das", "Dr. L. Mehta", "Dr. T. Nair",
    "Dr. V. Yadav", "Dr. H. Bose", "Dr. G. Rao", "Dr. D. Kaur", "Dr. B. Chauhan",
]
SPECIALTIES = ["General Medicine", "Pediatrics", "Obstetrics", "General Surgery", "Community Medicine"]

TESTS = [
    ("Malaria RDT", "Rapid Diagnostic"), ("Dengue NS1", "Rapid Diagnostic"),
    ("Hemoglobin", "Hematology"), ("Blood Sugar", "Biochemistry"),
    ("Pregnancy Test", "Rapid Diagnostic"), ("Widal Test", "Serology"),
    ("Urine Routine", "Pathology"), ("HIV Rapid", "Rapid Diagnostic"),
]


def _season_factor(day: date, kind: str) -> float:
    """Monthly seasonal multiplier. India: monsoon ~Jul-Sep, winter ~Nov-Feb."""
    m = day.month
    if kind == "monsoon":
        return 1.6 if m in (7, 8, 9) else (1.2 if m in (6, 10) else 0.85)
    if kind == "fever":
        return 1.3 if m in (7, 8, 9) else 1.0
    if kind == "winter":
        return 1.5 if m in (11, 12, 1, 2) else 0.8
    return 1.0


def _base_demand(pop: int, popularity: float) -> float:
    return max(2.0, (pop / 8000.0) * popularity * 6.0)


def seed_all(db: Session) -> None:
    _seed_master(db)
    _seed_usage_and_inventory(db)
    _seed_operational(db)
    db.commit()
    # generate initial redistribution recommendations
    from app.services.recommender import generate_recommendations
    generate_recommendations(db)


def _seed_master(db: Session) -> None:
    for i, (pid, name, typ, block, lat, lng, pop, prio) in enumerate(PHCS):
        db.add(PHC(phc_id=pid, name=name, type=typ, block=block, district=settings.district_name,
                   latitude=lat, longitude=lng, catchment_population=pop, priority_level=prio,
                   digital_maturity=MATURITY[i % len(MATURITY)]))
    for mid, name, unit, cat, crit, safety, _pop, _season, cold, storage in MEDICINES:
        db.add(Medicine(medicine_id=mid, name=name, unit=unit, category=cat,
                        critical=crit, min_safety_stock=safety,
                        cold_chain=cold, storage_condition=storage))
    db.flush()


def _seed_usage_and_inventory(db: Session) -> None:
    for pi, (pid, _n, _t, _b, _lat, _lng, pop, _prio) in enumerate(PHCS):
        for mj, (mid, _mn, _u, _c, _crit, safety, popularity, season_kind, _cold, _stor) in enumerate(MEDICINES):
            base = _base_demand(pop, popularity)
            recent14: list[float] = []
            for d in range(HISTORY_DAYS, 0, -1):
                day = TODAY - timedelta(days=d)
                weekday = 1.15 if day.weekday() < 5 else 0.7   # clinics busier on weekdays
                season = _season_factor(day, season_kind)
                trend = 1.0 + 0.15 * math.sin(pi + mj + d / 30.0)  # gentle drift
                noise = RNG.uniform(0.75, 1.25)
                qty = max(0, round(base * weekday * season * trend * noise))
                db.add(UsageRecord(phc_id=pid, medicine_id=mid, used_qty=qty, usage_date=day))
                if d <= 14:
                    recent14.append(qty)

            mean_recent = (sum(recent14) / len(recent14)) if recent14 else base

            # engineer role: deficit / surplus / normal (spread across PHCs per medicine)
            role = _role(pi, mj)
            if mj == 14:
                # Orphan near-expiry scenario (demonstrates return-to-store): one
                # centre holds near-expiry Vitamin A surplus while no nearby PHC is
                # in deficit for it, so the only safe action is return-to-store.
                if pi == 7:
                    stock = round(safety * 3.0 + mean_recent * 20)
                    expiry = TODAY + timedelta(days=18)
                else:
                    stock = round(safety * 1.6 + mean_recent * 10)
                    expiry = TODAY + timedelta(days=RNG.randint(120, 300))
            elif role == "deficit":
                stock = round(safety * RNG.uniform(0.2, 0.55))       # below safety -> critical
                expiry = TODAY + timedelta(days=RNG.randint(120, 360))
            elif role == "surplus":
                stock = round(safety * 2.4 + mean_recent * RNG.uniform(16, 24))
                # ~half of surplus holders carry a near-expiry batch. Where a nearby
                # PHC needs it -> redistribute; where none does -> return to store.
                expiry = TODAY + timedelta(days=RNG.randint(15, 30) if RNG.random() < 0.5
                                           else RNG.randint(150, 340))
            else:
                stock = round(safety * 1.3 + mean_recent * RNG.uniform(5, 9))
                expiry = TODAY + timedelta(days=RNG.randint(90, 320))

            # capture method + recency drive data-confidence scoring
            via_roll = (pi + mj) % 5
            if via_roll == 0:
                method, age = "barcode", 0
            elif via_roll in (1, 2):
                method, age = "manual", RNG.choice([1, 2, 3])
            elif via_roll == 3:
                method, age = "manual", RNG.randint(5, 9)      # -> low confidence
            else:
                method, age = "sms", RNG.randint(10, 14)       # -> very low confidence

            db.add(InventorySnapshot(
                phc_id=pid, medicine_id=mid, stock_qty=int(stock),
                batch_no=f"B{RNG.randint(1000, 9999)}", expiry_date=expiry,
                snapshot_date=TODAY - timedelta(days=age), updated_via=method))
    db.flush()


def _role(pi: int, mj: int) -> str:
    # deterministic spread so every medicine has both donors and receivers
    r = (pi * 3 + mj) % 8
    if r in (0, 5):
        return "deficit"
    if r in (2, 3):
        return "surplus"
    return "normal"


def _seed_operational(db: Session) -> None:
    for pi, (pid, _n, typ, _b, _lat, _lng, pop, _prio) in enumerate(PHCS):
        # --- beds (CHCs larger) ---
        scale = 2.2 if typ == "CHC" else 1.0
        gt = int(10 * scale); it = int(2 * scale); mt = int(4 * scale)
        pressure = 0.92 if pi in (2, 4) else RNG.uniform(0.45, 0.8)  # 2 near-full centres
        db.add(Bed(phc_id=pid,
                   general_total=gt, general_occupied=min(gt, round(gt * pressure)),
                   icu_total=it, icu_occupied=min(it, round(it * pressure)),
                   maternity_total=mt, maternity_occupied=min(mt, round(mt * RNG.uniform(0.4, 0.9))),
                   updated_at=datetime.utcnow()))

        # --- footfall history (28 days) ---
        for d in range(28, 0, -1):
            day = TODAY - timedelta(days=d)
            wk = 1.2 if day.weekday() < 5 else 0.6
            opd = max(5, round(pop / 320 * wk * RNG.uniform(0.8, 1.2)))
            ipd = max(0, round(opd * 0.08))
            emg = max(0, round(opd * 0.05))
            db.add(FootfallRecord(phc_id=pid, record_date=day, opd=opd, ipd=ipd, emergency=emg))

        # --- doctors (CHCs have more; some absent) ---
        n_docs = 4 if typ == "CHC" else 2
        for k in range(n_docs):
            name = DOCTOR_NAMES[(pi * 2 + k) % len(DOCTOR_NAMES)]
            roll = RNG.random()
            status = "present" if roll < 0.7 else ("absent" if roll < 0.88 else "on_leave")
            # force low attendance at one centre for a doctor-gap flag
            if pi == 2 and k >= 1:
                status = "absent"
            db.add(Doctor(phc_id=pid, name=name, specialty=SPECIALTIES[(pi + k) % len(SPECIALTIES)],
                          status=status, expected=True,
                          since=datetime.utcnow() - timedelta(hours=RNG.randint(1, 8))))

        # --- tests (some unavailable) ---
        for ti, (tname, tcat) in enumerate(TESTS):
            available = True
            r_en = r_hi = ""
            # engineer 1-2 outages at a couple of centres
            if (pi in (2, 5) and ti in (0, 3)) or RNG.random() < 0.08:
                available = False
                r_en = RNG.choice(["Kit stock exhausted", "Reagent unavailable", "Analyzer under repair"])
                r_hi = {"Kit stock exhausted": "किट स्टॉक समाप्त",
                        "Reagent unavailable": "अभिकर्मक अनुपलब्ध",
                        "Analyzer under repair": "विश्लेषक मरम्मत में"}[r_en]
            db.add(TestAvailability(phc_id=pid, test_name=tname, category=tcat, available=available,
                                    reason_en=r_en, reason_hi=r_hi, updated_at=datetime.utcnow()))
    db.flush()
