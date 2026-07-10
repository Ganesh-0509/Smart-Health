"""Pytest fixtures: an isolated, freshly-seeded API TestClient.

The full seed (90-day usage ledgers + ML forecasting for the recommender) takes
tens of seconds, so we seed exactly once per session into an isolated temp SQLite
file, snapshot that file, and restore the snapshot before each test. Every test
therefore gets pristine, deterministic state without paying the seed cost again —
and the developer's own ``smarthealth.db`` is never touched.
"""
from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path

import pytest

# Point the app at an isolated temp DB *before* importing any app module, so the
# module-level engine binds to it (and never to the dev smarthealth.db).
_TMP = Path(tempfile.mkdtemp(prefix="smarthealth-tests-"))
_DB = _TMP / "test.db"
_GOLDEN = _TMP / "golden.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_DB.as_posix()}"

from app.core.database import Base, SessionLocal, engine, init_db  # noqa: E402
from app.seed import seed_all  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _golden_db():
    """Seed once, then snapshot the SQLite file as the per-test golden image.

    ``seed_all`` already runs the recommender, so the golden image ships with a
    set of ``awaiting_verification`` recommendations. Tests therefore never pay
    the ~30s cost of ``POST /recommendations/generate`` — they read what's there.
    """
    Base.metadata.drop_all(bind=engine)
    init_db()
    with SessionLocal() as db:
        seed_all(db)
    engine.dispose()                 # release the file handle before copying
    shutil.copyfile(_DB, _GOLDEN)
    yield
    shutil.rmtree(_TMP, ignore_errors=True)


@pytest.fixture
def client():
    """A TestClient over a pristine restore of the freshly-seeded database."""
    from fastapi.testclient import TestClient

    from app.main import app

    engine.dispose()                 # drop pooled connections so the copy succeeds
    shutil.copyfile(_GOLDEN, _DB)
    with TestClient(app) as c:
        yield c
