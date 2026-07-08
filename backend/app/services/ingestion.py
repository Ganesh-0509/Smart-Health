"""Low-connectivity stock ingestion: SMS text and CSV upload.

Not every rural PHC has a desktop, stable internet, or a trained operator, so
stock updates must be possible via a mobile app, a plain SMS, a district CSV
upload, or an upstream government-platform sync (DVDMS/e-Aushadhi/HMIS/eLMIS).
This module implements the SMS and CSV fallbacks.
"""
from __future__ import annotations

import csv
import io
import re
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import InventorySnapshot, Medicine, PHC


def _resolve_phc(db: Session, token: str) -> str | None:
    token = token.strip()
    if db.get(PHC, token):
        return token
    norm = re.sub(r"[^a-z0-9]", "", token.lower())
    for p in db.execute(select(PHC)).scalars().all():
        if re.sub(r"[^a-z0-9]", "", p.phc_id.lower()) == norm:
            return p.phc_id
    return None


def _resolve_medicine(db: Session, token: str) -> str | None:
    token = token.strip()
    if db.get(Medicine, token):
        return token
    tl = token.lower()
    meds = db.execute(select(Medicine)).scalars().all()
    for m in meds:  # exact/prefix on name
        if m.name.lower() == tl or m.name.lower().startswith(tl):
            return m.medicine_id
    for m in meds:  # substring / first word
        if tl in m.name.lower() or m.name.lower().split()[0] == tl:
            return m.medicine_id
    return None


def _parse_expiry(token: str) -> date | None:
    token = token.strip()
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", token)
    if m:
        return date(int(m[1]), int(m[2]), int(m[3]))
    m = re.match(r"^(\d{4})-(\d{2})$", token)          # YYYY-MM
    if m:
        return date(int(m[1]), int(m[2]), 28)
    m = re.match(r"^(\d{2})-(\d{4})$", token)          # MM-YYYY
    if m:
        return date(int(m[2]), int(m[1]), 28)
    return None


def _ai_fallback(db: Session, message: str) -> tuple[str | None, str | None, int | None, "date | None", str]:
    """Use Gemini to parse a free-form SMS a regex can't. Returns resolved fields.

    Graceful: if Gemini is disabled or unsure, everything comes back None/"".
    """
    from app.services import gemini

    phc_ids = [p.phc_id for p in db.execute(select(PHC)).scalars().all()]
    med_names = [m.name for m in db.execute(select(Medicine)).scalars().all()]
    data = gemini.parse_sms_nl(message, phc_ids, med_names)
    if not data:
        return None, None, None, None, ""
    phc_id = _resolve_phc(db, str(data.get("phc_hint", "")))
    medicine_id = _resolve_medicine(db, str(data.get("medicine_hint", "")))
    qty = data.get("qty")
    expiry = _parse_expiry(str(data.get("expiry") or ""))
    batch = str(data.get("batch") or "")
    return phc_id, medicine_id, qty, expiry, batch


def parse_sms(db: Session, message: str, phc_hint: str | None = None) -> dict:
    """Parse a stock SMS. Accepted (case-insensitive) e.g.:
        STOCK PHC-03 ORS 120 EXP 2026-09 BATCH ORS24A
        PHC-03 ORS 120 09-2026
    Free-form messages that the regex can't parse fall back to Gemini (when a
    GEMINI_API_KEY is configured) so low-literacy field staff aren't forced into
    a rigid syntax.
    """
    raw = message.strip()
    tokens = raw.split()
    if tokens and tokens[0].upper() == "STOCK":
        tokens = tokens[1:]
    if not tokens:
        return {"ok": False, "error": "Empty message."}

    # --- deterministic regex parse (works offline, no key) -----------------------
    phc_id = _resolve_phc(db, tokens[0]) if tokens else None
    idx = 1
    if phc_id is None and phc_hint:
        phc_id, idx = _resolve_phc(db, phc_hint), 0

    rest = tokens[idx:] if phc_id is not None else tokens
    medicine_id = _resolve_medicine(db, rest[0]) if rest else None
    qty = next((int(t) for t in rest if t.isdigit()), None)

    expiry = None
    batch = ""
    for i, t in enumerate(rest):
        if t.upper() == "EXP" and i + 1 < len(rest):
            expiry = _parse_expiry(rest[i + 1])
        elif t.upper() == "BATCH" and i + 1 < len(rest):
            batch = rest[i + 1]
        elif expiry is None and _parse_expiry(t):
            expiry = _parse_expiry(t)

    # --- Gemini fallback when the regex couldn't identify the essentials ----------
    used_ai = False
    if phc_id is None or medicine_id is None or qty is None:
        a_phc, a_med, a_qty, a_exp, a_batch = _ai_fallback(db, raw)
        if a_phc or a_med or a_qty is not None:
            used_ai = True
            phc_id = phc_id or a_phc
            medicine_id = medicine_id or a_med
            qty = qty if qty is not None else a_qty
            expiry = expiry or a_exp
            batch = batch or a_batch

    if phc_id is None:
        return {"ok": False, "error": "Could not identify a PHC/CHC in the message."}
    if medicine_id is None:
        return {"ok": False, "error": "Could not identify the medicine."}
    if qty is None:
        return {"ok": False, "error": "Could not find a quantity."}

    if expiry is None:
        expiry = date(date.today().year + 1, date.today().month, 28)

    snap = InventorySnapshot(
        phc_id=phc_id, medicine_id=medicine_id, stock_qty=qty,
        batch_no=batch or f"SMS-{date.today():%y%m%d}", expiry_date=expiry,
        snapshot_date=date.today(), updated_via="sms")
    db.add(snap)
    db.commit()
    med = db.get(Medicine, medicine_id)
    return {"ok": True, "phc_id": phc_id, "medicine_id": medicine_id,
            "medicine_name": med.name if med else medicine_id, "stock_qty": qty,
            "batch_no": snap.batch_no, "expiry_date": expiry.isoformat(),
            "updated_via": "sms", "data_confidence": "low", "parsed_by": "gemini" if used_ai else "regex",
            "note_en": ("Parsed by Gemini AI. " if used_ai else "")
                       + "Recorded via SMS — physical verification advised before transfer.",
            "note_hi": ("Gemini AI द्वारा पार्स किया गया। " if used_ai else "")
                       + "SMS द्वारा दर्ज — स्थानांतरण से पहले भौतिक सत्यापन सुझाया गया।"}


def ingest_csv(db: Session, csv_text: str) -> dict:
    """Upsert inventory snapshots from CSV text.

    Header: phc_id,medicine_id,stock_qty,batch_no,expiry_date,snapshot_date
    """
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    inserted, errors = 0, []
    for i, row in enumerate(reader, start=2):
        try:
            phc_id = _resolve_phc(db, row["phc_id"])
            medicine_id = _resolve_medicine(db, row["medicine_id"])
            if not phc_id or not medicine_id:
                errors.append(f"row {i}: unknown phc/medicine")
                continue
            expiry = _parse_expiry(row.get("expiry_date", "")) or date(date.today().year + 1, 1, 28)
            snap_date = _parse_expiry(row.get("snapshot_date", "")) or date.today()
            db.add(InventorySnapshot(
                phc_id=phc_id, medicine_id=medicine_id, stock_qty=int(row["stock_qty"]),
                batch_no=row.get("batch_no", ""), expiry_date=expiry,
                snapshot_date=snap_date, updated_via="csv"))
            inserted += 1
        except (KeyError, ValueError) as e:  # noqa: PERF203
            errors.append(f"row {i}: {e}")
    db.commit()
    return {"ok": True, "inserted": inserted, "errors": errors, "updated_via": "csv",
            "data_confidence": "medium"}
