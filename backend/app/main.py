"""Smart Health API — FastAPI application entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.core.ratelimit import SLOWAPI_ENABLED, limiter
from app.models import PHC
from app.routers import (
    alerts, assistant, dashboard, district, forecast, ingest, inventory, master,
    operational, recommendations, reports,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Auto-seed on first run so the demo works out of the box.
    with SessionLocal() as db:
        count = db.execute(select(func.count()).select_from(PHC)).scalar_one()
        if count == 0:
            from app.seed import seed_all
            seed_all(db)
    yield


app = FastAPI(
    title="Smart Health API",
    description="AI-driven health-centre & supply-chain management for PHCs/CHCs.",
    version=settings.version,
    lifespan=lifespan,
)

# Rate limiting (graceful: the app still boots if slowapi is unavailable).
if SLOWAPI_ENABLED:
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    # The frontend only issues GET/POST JSON requests; keep the surface explicit.
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

for r in (master, dashboard, inventory, forecast, recommendations, alerts,
          reports, operational, district, ingest, assistant):
    app.include_router(r.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    return {
        "status": "ok", "service": settings.app_name, "version": settings.version,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/", tags=["meta"])
def root() -> dict:
    return {"service": settings.app_name, "docs": "/docs", "health": "/api/health"}
