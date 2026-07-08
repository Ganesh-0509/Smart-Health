"""Demand forecasting engine.

Design (per the AI/ML blueprint): *predict then optimize*. This module owns the
prediction half — a tabular, explainable forecaster with a moving-average
baseline it must beat.

Model selection is graceful and never crashes a request:
    LightGBM (if installed)  ->  scikit-learn GradientBoosting  ->  seasonal
    moving-average fallback (for sparse series).

Everything is plain functions operating on (dates, usage) pairs so it is easy
to unit-test and to call per PHC + medicine.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta

import numpy as np
import pandas as pd

MODEL_VERSION = "1.0.0"

# ---- optional accelerated model -------------------------------------------------
try:  # pragma: no cover - environment dependent
    from lightgbm import LGBMRegressor  # type: ignore

    _HAS_LGBM = True
except Exception:  # noqa: BLE001
    _HAS_LGBM = False

from sklearn.ensemble import GradientBoostingRegressor

# Feature name -> (english factor, hindi factor) for explainability.
_FACTOR_TEXT = {
    "lag_1": ("yesterday's usage", "कल का उपयोग"),
    "lag_7": ("same day last week", "पिछले सप्ताह इसी दिन"),
    "lag_14": ("usage two weeks ago", "दो सप्ताह पहले का उपयोग"),
    "roll_mean_7": ("recent 7-day average demand", "हाल का 7-दिन औसत मांग"),
    "roll_std_7": ("recent demand volatility", "हाल की मांग में उतार-चढ़ाव"),
    "trend_slope": ("rising 7-day usage trend", "बढ़ता 7-दिन उपयोग रुझान"),
    "dow": ("day-of-week pattern", "सप्ताह-दिन पैटर्न"),
    "month": ("seasonal / monthly pattern", "मौसमी / मासिक पैटर्न"),
}
FEATURES = list(_FACTOR_TEXT.keys())


@dataclass
class ForecastResult:
    model: str
    model_version: str
    history: list[dict]
    forecast: list[dict]
    importances: dict[str, float] = field(default_factory=dict)
    top_factors_en: list[str] = field(default_factory=list)
    top_factors_hi: list[str] = field(default_factory=list)
    residual_std: float = 0.0


def _build_frame(dates: list[date], usage: list[float]) -> pd.DataFrame:
    df = pd.DataFrame({"date": pd.to_datetime(dates), "usage": np.asarray(usage, dtype=float)})
    df = df.sort_values("date").reset_index(drop=True)
    df["lag_1"] = df["usage"].shift(1)
    df["lag_7"] = df["usage"].shift(7)
    df["lag_14"] = df["usage"].shift(14)
    df["roll_mean_7"] = df["usage"].shift(1).rolling(7, min_periods=1).mean()
    df["roll_std_7"] = df["usage"].shift(1).rolling(7, min_periods=1).std().fillna(0.0)
    df["trend_slope"] = df["roll_mean_7"] - df["usage"].shift(1).rolling(14, min_periods=1).mean()
    df["dow"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    return df


def _make_regressor():
    if _HAS_LGBM:
        return LGBMRegressor(n_estimators=200, learning_rate=0.05, max_depth=4,
                             num_leaves=15, min_child_samples=5, verbose=-1), "lightgbm"
    return (
        GradientBoostingRegressor(n_estimators=200, learning_rate=0.05, max_depth=3),
        "gradient_boosting",
    )


def _seasonal_moving_average(df: pd.DataFrame, horizon: int) -> tuple[list[float], float]:
    """Baseline: weekly-seasonal moving average. Always works."""
    usage = df["usage"].to_numpy(dtype=float)
    dow = df["date"].dt.dayofweek.to_numpy()
    overall = float(np.mean(usage[-14:])) if len(usage) else 0.0
    preds = []
    last_date = df["date"].iloc[-1]
    for h in range(1, horizon + 1):
        target_dow = (last_date + pd.Timedelta(days=h)).dayofweek
        same = usage[dow == target_dow]
        preds.append(float(np.mean(same[-4:])) if same.size else overall)
    resid = float(np.std(usage[-21:])) if len(usage) > 1 else max(1.0, overall * 0.2)
    return preds, resid


def forecast_series(dates: list[date], usage: list[float], horizon: int = 14) -> ForecastResult:
    """Forecast ``horizon`` days ahead. Returns history + forecast + explanation."""
    df = _build_frame(dates, usage)
    history = [
        {"date": d.date().isoformat(), "usage": round(float(u), 1)}
        for d, u in zip(df["date"], df["usage"])
    ]
    last_date = df["date"].iloc[-1].date()

    # Sparse series -> baseline only.
    train = df.dropna()
    if len(train) < 25:
        preds, resid = _seasonal_moving_average(df, horizon)
        model_name = "moving_average"
        importances: dict[str, float] = {}
    else:
        model, model_name = _make_regressor()
        x = train[FEATURES].to_numpy()
        y = train["usage"].to_numpy()
        model.fit(x, y)
        resid = float(np.std(y - model.predict(x))) or 1.0
        raw_imp = getattr(model, "feature_importances_", np.ones(len(FEATURES)))
        total = float(np.sum(raw_imp)) or 1.0
        importances = {f: round(float(v) / total, 3) for f, v in zip(FEATURES, raw_imp)}
        preds = _recursive_forecast(df, model, horizon)

    forecast = []
    for h, p in enumerate(preds, start=1):
        d = last_date + timedelta(days=h)
        p = max(0.0, p)
        band = 1.28 * resid  # ~80% interval
        forecast.append({
            "date": d.isoformat(),
            "predicted": round(p, 1),
            "lower": round(max(0.0, p - band), 1),
            "upper": round(p + band, 1),
        })

    top = sorted(importances.items(), key=lambda kv: kv[1], reverse=True)[:3] if importances else []
    en = [_FACTOR_TEXT[f][0] for f, _ in top] or ["recent average demand", "weekly pattern"]
    hi = [_FACTOR_TEXT[f][1] for f, _ in top] or ["हाल का औसत मांग", "साप्ताहिक पैटर्न"]

    return ForecastResult(
        model=model_name, model_version=MODEL_VERSION, history=history, forecast=forecast,
        importances=importances, top_factors_en=en, top_factors_hi=hi, residual_std=round(resid, 2),
    )


def _recursive_forecast(df: pd.DataFrame, model, horizon: int) -> list[float]:
    """Roll the model forward one day at a time, feeding predictions back in."""
    series = df[["date", "usage"]].copy()
    preds: list[float] = []
    for _ in range(horizon):
        nxt = _next_feature_row(series)
        yhat = float(model.predict(nxt[FEATURES].to_numpy())[0])
        yhat = max(0.0, yhat)
        preds.append(yhat)
        series = pd.concat(
            [series, pd.DataFrame({"date": [nxt["date"].iloc[0]], "usage": [yhat]})],
            ignore_index=True,
        )
    return preds


def _next_feature_row(series: pd.DataFrame) -> pd.DataFrame:
    s = series["usage"].to_numpy(dtype=float)
    next_date = series["date"].iloc[-1] + pd.Timedelta(days=1)

    def lag(n: int) -> float:
        return float(s[-n]) if len(s) >= n else float(s[-1])

    roll_mean_7 = float(np.mean(s[-7:])) if len(s) else 0.0
    roll_std_7 = float(np.std(s[-7:])) if len(s) > 1 else 0.0
    roll_mean_14 = float(np.mean(s[-14:])) if len(s) else 0.0
    return pd.DataFrame([{
        "date": next_date,
        "lag_1": lag(1), "lag_7": lag(7), "lag_14": lag(14),
        "roll_mean_7": roll_mean_7, "roll_std_7": roll_std_7,
        "trend_slope": roll_mean_7 - roll_mean_14,
        "dow": next_date.dayofweek, "month": next_date.month,
    }])


# ---- evaluation / backtesting ---------------------------------------------------

def _metrics(actual: np.ndarray, pred: np.ndarray) -> dict[str, float]:
    actual, pred = np.asarray(actual, float), np.asarray(pred, float)
    err = pred - actual
    mae = float(np.mean(np.abs(err)))
    rmse = float(np.sqrt(np.mean(err ** 2)))
    denom = np.where(actual == 0, 1e-9, actual)
    mape = float(np.mean(np.abs(err / denom)) * 100)
    wape = float(np.sum(np.abs(err)) / (np.sum(np.abs(actual)) + 1e-9) * 100)
    bias = float(np.mean(err))
    return {"MAE": round(mae, 2), "RMSE": round(rmse, 2), "MAPE": round(min(mape, 999), 1),
            "WAPE": round(wape, 1), "bias": round(bias, 2)}


def backtest(dates: list[date], usage: list[float], test_days: int = 14) -> dict:
    """Time-split backtest comparing the model against the moving-average baseline."""
    df = _build_frame(dates, usage)
    if len(df.dropna()) < 30:
        return {}
    split = len(df) - test_days
    train, test = df.iloc[:split], df.iloc[split:]

    model, model_name = _make_regressor()
    tr = train.dropna()
    model.fit(tr[FEATURES].to_numpy(), tr["usage"].to_numpy())
    model_pred = model.predict(test[FEATURES].fillna(0).to_numpy())

    # baseline: predict each test day as mean of prior 7 days
    base_pred = train["usage"].to_numpy()[-7:].mean() * np.ones(len(test))

    actual = test["usage"].to_numpy()
    m, b = _metrics(actual, model_pred), _metrics(actual, base_pred)
    improvement = round((b["WAPE"] - m["WAPE"]) / (b["WAPE"] + 1e-9) * 100, 1)
    return {
        "model": model_name, "baseline": "moving_average",
        "metrics": m, "baseline_metrics": b, "improvement_pct": improvement,
    }
