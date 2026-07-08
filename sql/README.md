# SQL

The schema is managed by **SQLAlchemy** (`backend/app/models.py`) and created
automatically via `Base.metadata.create_all` on startup — there is no manual
migration step for the demo.

## Targeting PostgreSQL
1. `pip install "psycopg[binary]"`
2. Set the DSN before starting the backend:
   ```
   DATABASE_URL=postgresql+psycopg://smarthealth:smarthealth@localhost:5432/smarthealth
   ```
   (or use `docker compose --profile postgres up`)
3. Tables are created on first run; seed with `python backend/scripts/seed.py --reset`.

## Tables
`phcs`, `medicines`, `inventory_snapshots`, `usage_records`, `recommendations`,
`beds`, `footfall_records`, `doctors`, `test_availability`.

For column-level detail see `backend/app/models.py` and `docs/Technical-Specification.md`.
