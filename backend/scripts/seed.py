"""Standalone (re)seed script.

Usage (from backend/, with the venv active):
    python scripts/seed.py            # seed if empty
    python scripts/seed.py --reset    # drop all tables, recreate, reseed
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select  # noqa: E402

from app.core.database import Base, SessionLocal, engine, init_db  # noqa: E402
from app.models import PHC  # noqa: E402
from app.seed import seed_all  # noqa: E402


def main() -> None:
    reset = "--reset" in sys.argv
    if reset:
        print("Dropping all tables ...")
        Base.metadata.drop_all(bind=engine)
    init_db()
    with SessionLocal() as db:
        count = db.execute(select(func.count()).select_from(PHC)).scalar_one()
        if count and not reset:
            print(f"Database already has {count} PHCs. Use --reset to rebuild.")
            return
        print("Seeding synthetic district data ...")
        seed_all(db)
        n_phc = db.execute(select(func.count()).select_from(PHC)).scalar_one()
        print(f"Done. Seeded {n_phc} PHCs with 90 days of history and recommendations.")


if __name__ == "__main__":
    main()
