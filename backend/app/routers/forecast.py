"""Forecasting endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.ml import forecasting
from app.models import Medicine, UsageRecord
from app.services import analytics
from app.services.recommender import HORIZON, _usage_history

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


def _shortage_risk(stock: int, safety: int, forecast_sum: float) -> float:
    need = forecast_sum + safety
    if need <= 0:
        return 0.0
    return round(max(0.0, min(1.0, (need - stock) / need)), 2)


@router.get("")
def get_forecast(phc_id: str = Query(...), medicine_id: str = Query(...),
                 horizon: int = 14, lang: str = "en",
                 db: Session = Depends(get_db)) -> dict:
    dates, usage = _usage_history(db, phc_id, medicine_id)
    if not usage:
        raise HTTPException(status_code=404, detail="No usage history for this PHC/medicine")
    result = forecasting.forecast_series(dates, usage, horizon)

    med = db.get(Medicine, medicine_id)
    snap = analytics.latest_snapshot(db, phc_id, medicine_id)
    forecast_sum = sum(f["predicted"] for f in result.forecast[:HORIZON])
    risk = _shortage_risk(snap.stock_qty if snap else 0,
                          med.min_safety_stock if med else 0, forecast_sum)

    return {
        "phc_id": phc_id, "medicine_id": medicine_id, "horizon_days": horizon,
        "model": result.model, "model_version": result.model_version,
        "history": result.history, "forecast": result.forecast,
        "risk_score": risk,
        "explain": {"top_factors_en": result.top_factors_en,
                    "top_factors_hi": result.top_factors_hi},
    }


@router.get("/metrics")
def metrics(phc_id: str | None = None, medicine_id: str | None = None,
            db: Session = Depends(get_db)) -> dict:
    """Backtest metrics on a representative high-volume series (or the chosen one)."""
    if phc_id and medicine_id:
        dates, usage = _usage_history(db, phc_id, medicine_id)
    else:
        # benchmark on the (phc, medicine) with the richest history
        dates, usage = _busiest_series(db)
    result = forecasting.backtest(dates, usage)
    if not result:
        return {"model": "moving_average", "baseline": "moving_average",
                "metrics": {}, "baseline_metrics": {}, "improvement_pct": 0.0,
                "note": "Insufficient history for a full backtest."}
    return result


def _busiest_series(db: Session):
    from sqlalchemy import func

    pair = db.execute(
        select(UsageRecord.phc_id, UsageRecord.medicine_id, func.count(UsageRecord.id).label("n"))
        .group_by(UsageRecord.phc_id, UsageRecord.medicine_id)
        .order_by(func.count(UsageRecord.id).desc())
    ).first()
    if not pair:
        return [], []
    return _usage_history(db, pair[0], pair[1])
