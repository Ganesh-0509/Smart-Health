"""Ask-the-district assistant — natural-language Q&A over live data (Gemini).

Falls back to a deterministic answer built from the same data snapshot when
Gemini is unavailable, so the feature always returns something useful.
"""
# NOTE: no ``from __future__ import annotations`` here — the slowapi rate-limit
# decorator wraps ``ask``, and FastAPI must see real (non-stringified) type
# annotations to resolve the request-body model through the wrapper.
from fastapi import APIRouter, Body, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.ratelimit import limiter
from app.services import analytics, gemini, insights

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


class AskBody(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    lang: str = Field(default="en", max_length=10)


def _snapshot(db: Session) -> dict:
    """Compact, JSON-serialisable live-data context for the model / fallback."""
    dist = insights.district_overview(db)
    items = analytics.all_inventory(db)
    critical = [
        {"phc": it["phc_name"], "medicine": it["medicine_name"],
         "days_of_cover": it["days_of_cover"], "risk": it["risk_level"]}
        for it in items if it["risk_level"] == "critical"
    ]
    near_expiry = [
        {"phc": it["phc_name"], "medicine": it["medicine_name"],
         "days_to_expiry": it["days_to_expiry"]}
        for it in items if it.get("near_expiry")
    ]
    recs = insights_open_recs(db)
    return {
        "district": dist["district"],
        "district_kpis": dist["district_kpis"],
        "flagged_centres": [
            {"phc": s["name"], "health_score": s["health_score"],
             "reason": s["flag_reason_en"]}
            for s in dist["phc_scores"] if s["flagged"]
        ],
        "critical_stock": critical[:25],
        "near_expiry": near_expiry[:25],
        "open_transfers": recs[:25],
    }


def insights_open_recs(db: Session) -> list[dict]:
    from app.models import Recommendation
    from sqlalchemy import select
    rows = db.execute(
        select(Recommendation).where(Recommendation.status.in_(insights.OPEN_STATUSES))
        .order_by(Recommendation.priority_score.desc())
    ).scalars().all()
    out = []
    for r in rows:
        out.append({
            "id": r.recommendation_id, "medicine": r.medicine_id,
            "from": r.source_phc_id, "to": r.target_phc_id,
            "qty": r.suggested_qty, "urgency": r.urgency,
            "logistics": r.logistics_model, "status": r.status,
        })
    return out


def _fallback_answer(question: str, ctx: dict) -> dict:
    """Deterministic answer when Gemini is off — summarise the snapshot."""
    k = ctx["district_kpis"]
    crit = ctx["critical_stock"]
    flagged = ctx["flagged_centres"]
    parts_en = [
        f"District: {ctx['district']}. {k['critical_phcs']}/{k['total_phcs']} centres are critical "
        f"(avg health {k['avg_health_score']}).",
    ]
    parts_hi = [
        f"जिला: {ctx['district']}। {k['total_phcs']} में से {k['critical_phcs']} केंद्र गंभीर "
        f"(औसत स्कोर {k['avg_health_score']})।",
    ]
    if crit:
        top = ", ".join(f"{c['medicine']} @ {c['phc']} ({c['days_of_cover']}d)" for c in crit[:5])
        parts_en.append(f"Top stockout risks: {top}.")
        parts_hi.append(f"प्रमुख स्टॉक जोखिम: {top}।")
    if flagged:
        parts_en.append("Flagged centres: " + ", ".join(f["phc"] for f in flagged) + ".")
        parts_hi.append("चिह्नित केंद्र: " + ", ".join(f["phc"] for f in flagged) + "।")
    parts_en.append(f"{len(ctx['open_transfers'])} transfer recommendations awaiting action.")
    parts_hi.append(f"{len(ctx['open_transfers'])} स्थानांतरण सिफारिशें कार्रवाई हेतु लंबित।")
    return {"answer_en": " ".join(parts_en), "answer_hi": " ".join(parts_hi),
            "source": "fallback"}


@router.get("/status")
def status() -> dict:
    return gemini.status()


@router.post("/ask")
@limiter.limit("10/minute")
def ask(request: Request, body: AskBody = Body(...), db: Session = Depends(get_db)) -> dict:
    ctx = _snapshot(db)
    ai = gemini.answer_question(body.question, ctx, body.lang)
    answer = ai or _fallback_answer(body.question, ctx)
    return {
        "question": body.question,
        "answer_en": answer["answer_en"],
        "answer_hi": answer["answer_hi"],
        "source": answer["source"],
        "grounding": {
            "flagged_centres": len(ctx["flagged_centres"]),
            "critical_items": len(ctx["critical_stock"]),
            "open_transfers": len(ctx["open_transfers"]),
        },
    }
