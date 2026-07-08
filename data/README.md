# Data

For the demo, all data is **generated synthetically and deterministically** by
`backend/app/seed.py` (fixed RNG seed) and loaded automatically on first backend
run — no files here are required to run the project.

These CSV templates document the ingestion schema for a real deployment (HMIS /
manual upload). Column order matches the entities in `docs/Technical-Specification.md`
and the ORM models in `backend/app/models.py`.

- `phc_master.csv` — one row per PHC/CHC
- `medicine_master.csv` — one row per medicine/item
- `inventory_snapshot.csv` — current stock by centre, medicine, batch
- `usage_history.csv` — daily consumption by centre and medicine

To export the live seeded database to CSV, query the API (e.g. `/api/inventory`)
or read `backend/smarthealth.db` with any SQLite client.
