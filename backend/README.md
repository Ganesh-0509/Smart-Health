# Smart Health — Backend (FastAPI)

AI-driven health-centre & supply-chain management API: demand forecasting,
OR-Tools stock redistribution, live alerts, and operational modules (beds,
footfall, doctor attendance, test availability) with a district intelligence view.

## Stack
- **FastAPI** + **SQLAlchemy 2** (SQLite by default, PostgreSQL-ready)
- **scikit-learn** gradient boosting for demand forecasting (LightGBM optional),
  moving-average baseline, time-split backtesting (MAE/RMSE/MAPE/WAPE/bias)
- **Google OR-Tools** transportation LP for redistribution (greedy fallback)
- **Google AI (Gemini)** via the `google-genai` SDK for NL SMS parsing, supervisor briefings, and the
  "Ask the district" assistant — each with a deterministic fallback (optional, off by default)
- **Human-in-the-loop approval state machine** with batch-level audit trail, data-confidence
  scoring, escalation/emergency handling, logistics models, and return-to-store proposals
  (see `docs/GOVERNANCE-WORKFLOW.md`)
- **Low-connectivity ingestion:** SMS parser + CSV upload (`/api/ingest/*`)
- Bilingual (English / हिंदी) output on every human-readable field

## Quick start (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```
On macOS/Linux use `source .venv/bin/activate`. The database **auto-seeds on
first run** — no manual step needed.

- API docs (Swagger): http://localhost:8000/docs
- Health: http://localhost:8000/api/health

## Reseed
```powershell
python scripts/seed.py --reset
```

## Smoke test (exercises every endpoint end-to-end)
```powershell
pip install httpx
python scripts/smoke_test.py
```

## Configuration
Copy `.env.example` → `.env`. Set `DATABASE_URL` to a Postgres DSN for a
production-style deployment; otherwise a local `smarthealth.db` SQLite file is used.

## Google AI (Gemini)
Three features are Gemini-powered: natural-language SMS parsing (`POST /api/ingest/sms`),
supervisor briefings (`GET /api/recommendations/{id}/briefing`), and the "Ask the district"
assistant (`POST /api/assistant/ask`, `GET /api/assistant/status`).

**Enable it:** set `GEMINI_API_KEY` in `.env` (get a free key at
<https://aistudio.google.com/apikey>). Optionally override the model with `GEMINI_MODEL`
(default `gemini-2.0-flash`). Both are optional and documented in `.env.example`.

**Fallback:** with no key set, every feature degrades gracefully — SMS falls back to the offline
regex parser, briefings fall back to the recommendation's own reason fields, and the assistant
returns a deterministic summary. The API runs fully without any Gemini configuration.

## Layout
```
app/
├── main.py            # FastAPI app, CORS, lifespan auto-seed
├── models.py          # SQLAlchemy models (all modules)
├── seed.py            # synthetic district generator
├── core/              # config, database, geo, i18n
├── ml/forecasting.py  # forecasting + backtesting
├── optimization/      # OR-Tools optimizer (+ greedy fallback)
├── services/          # analytics, recommender, modules, insights
└── routers/           # REST endpoints (see docs/API-CONTRACT.md)
```

See `docs/API-CONTRACT.md` for the full endpoint reference.
