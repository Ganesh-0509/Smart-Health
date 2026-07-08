# Smart Health — AI-Driven Health Centre & Supply Chain Management

> A multilingual (English / हिंदी) platform for **real-time management of a district's PHCs & CHCs** — medicine stock intelligence, patient footfall, bed availability, doctor attendance, and diagnostic-test audits — with **AI demand forecasting**, **OR-Tools stock redistribution**, early stock-out warnings, and automatic flagging of under-resourced centres for district intervention.

Built for low-resource rural healthcare. Runs end-to-end on a laptop with zero external infrastructure.

---

## What it does (maps 1:1 to the problem statement)

| Problem-statement requirement | In this project |
|---|---|
| Real-time stock monitoring | Inventory module with days-of-cover, safety-stock & risk classification |
| Early stock-out warnings | Live alerts + risk scoring per medicine per centre |
| AI-driven demand forecasts | Gradient-boosting forecaster (LightGBM-ready) with moving-average baseline & backtested metrics |
| Smart resource redistribution | OR-Tools transportation optimiser recommending inter-PHC transfers |
| Patient footfall | Footfall module: OPD/IPD/emergency trends per centre |
| Bed availability | Beds module: general/ICU/maternity occupancy & pressure |
| Doctor attendance | Doctors module: present/absent/on-leave, attendance rate |
| Test availability audits | Tests module: available/unavailable with reasons |
| Flag under-resourced centres | District Intelligence view: composite health score auto-flags centres for intervention |
| Multilingual | Every screen & every AI explanation in English + Hindi |

### Governance — the AI proposes, humans decide

The system **never moves stock autonomously**. It is a *human-in-the-loop redistribution
intelligence layer* (see [`docs/GOVERNANCE-WORKFLOW.md`](docs/GOVERNANCE-WORKFLOW.md)):

- **Approval state machine:** `awaiting_verification → awaiting_approval → approved → assigned → picked_up → stock_updated` (or `rejected`, reason required) — every step is a human action with a full audit trail.
- **Batch-level auditability:** batch no, expiry, cold-chain flag, storage condition, source buffer-after-transfer, predicted stockout date, and who did what when.
- **Data-confidence scoring:** stock figures are rated `high/medium/low/very_low` by how/when they were captured; low-confidence transfers demand physical verification before approval.
- **Escalation & emergencies:** stockout-within-48h is fast-tracked; near-expiry surplus with no receiver becomes a **return-to-store** recommendation.
- **Logistics models:** piggyback on existing supply runs · hub-and-spoke via district store · emergency lateral · return-to-store — no parallel fleet invented.
- **Low-connectivity ingestion:** update stock by **SMS** (`STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A`), CSV upload, or app — designed for three digital-maturity tiers of rural PHCs.

---

## Architecture

```
┌─────────────────────────────┐        REST / JSON (CORS)        ┌──────────────────────────────┐
│   Frontend — Next.js 14      │  ◀──────────────────────────▶   │   Backend — FastAPI          │
│   App Router · TypeScript    │      http://localhost:8000      │                              │
│   Tailwind · Recharts        │                                 │  ┌────────────────────────┐  │
│   EN / हिंदी · 12 screens     │                                 │  │ Forecasting (scikit-    │  │
│   Mock-fallback (demo-safe)  │                                 │  │ learn GB · MA baseline) │  │
└─────────────────────────────┘                                 │  └────────────────────────┘  │
                                                                 │  ┌────────────────────────┐  │
                                                                 │  │ Optimization (OR-Tools  │  │
                                                                 │  │ LP · greedy fallback)   │  │
                                                                 │  └────────────────────────┘  │
                                                                 │  Services · Routers          │
                                                                 │  SQLAlchemy → SQLite/Postgres│
                                                                 └──────────────────────────────┘
```

**Design pattern:** *predict → optimise → explain → approve.* Forecast demand per medicine per
centre, feed it into a constrained optimiser that computes feasible transfers minimising shortage,
expiry waste, and transport distance, then present every action with a plain-language bilingual
reason for a human to approve.

Full design rationale lives in [`docs/`](docs/): PRD, SDD/HLD, Technical Spec, AI/ML Blueprint,
UI/UX Design System, Development Roadmap, and the [API Contract](docs/API-CONTRACT.md).

---

## Tech stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, lucide-react
- **Backend:** FastAPI, SQLAlchemy 2 (SQLite default, **PostgreSQL-ready**), Pydantic v2
- **AI/ML:** scikit-learn gradient boosting (optional LightGBM), moving-average baseline, time-split backtesting (MAE / RMSE / MAPE / WAPE / bias)
- **Generative AI:** Google **Gemini** (`google-genai` SDK, default `gemini-2.0-flash`, free tier) for NL SMS parsing, supervisor briefings, and the "Ask the district" assistant — each with a deterministic fallback so the app runs with no API key
- **Auth:** **Firebase Authentication** (Google sign-in) in the frontend, with a demo-mode fallback (no config required)
- **Optimisation:** Google OR-Tools transportation LP, with a built-in greedy fallback
- **Deploy:** Docker + docker-compose (SQLite or Postgres profile)

---

## Google technologies

Built for the Google Cloud **"Build with AI: Code for Communities"** hackathon (Smart Health Centre
Management track). Every Google-AI feature is designed to **degrade gracefully** — the app runs
end-to-end with no API keys and no cloud dependency, so the live demo can never break.

- **Gemini** (`google-genai` SDK, default model `gemini-2.0-flash`, free tier) powers three features,
  each with a **deterministic fallback** when `GEMINI_API_KEY` is unset:
  1. **Natural-language SMS parsing** — free-form/messy stock texts a regex can't handle
     (e.g. *"we have about 120 ORS packets expiring december"*) are parsed by Gemini; the strict-format
     regex parser still works fully offline. The ingest response reports `parsed_by: "gemini" | "regex"`.
  2. **AI supervisor briefings** — `GET /api/recommendations/{id}/briefing` returns a plain-language
     bilingual (EN/HI) justification of a transfer for the approver; falls back to the recommendation's
     own reason fields.
  3. **"Ask the district" Q&A** — `POST /api/assistant/ask` answers natural-language questions over a
     live data snapshot (district overview + critical stock + near-expiry + open transfers); falls back
     to a deterministic summary. `GET /api/assistant/status` reports the live/fallback mode.
  - Get a free key at <https://aistudio.google.com/apikey>. Config: `GEMINI_API_KEY`, `GEMINI_MODEL`
    (both optional, see `backend/.env.example`).
- **Firebase Authentication** (Google sign-in) in the Next.js frontend, with a **demo-mode fallback**
  — it runs with no Firebase config (via `NEXT_PUBLIC_FIREBASE_*` env vars). Login is demonstrable but
  not required to use the app.
- **Google OR-Tools** — transportation LP for stock redistribution (greedy fallback), as above.

> **AI proposes, humans decide.** The Gemini briefings and NL parsing are **advisory only** — they
> never move stock or bypass the human-approval state machine (see
> [`docs/GOVERNANCE-WORKFLOW.md`](docs/GOVERNANCE-WORKFLOW.md)).

---

## Quick start

Two terminals. The database **auto-seeds** a full synthetic district on first backend run.

**1 — Backend (http://localhost:8000)**
```bash
cd backend
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**2 — Frontend (http://localhost:3000)**
```bash
cd frontend
npm install
npm run dev
```

Or start both at once:
```bash
# Windows
./scripts/dev.ps1
# macOS / Linux
./scripts/dev.sh
```

> The frontend has a **mock-data fallback**, so the UI renders fully even if the backend
> is not running — the live demo can never blank out.

- Swagger API docs: **http://localhost:8000/docs**
- One-command backend verification: `cd backend && pip install httpx && python scripts/smoke_test.py`

---

## Demo data (auto-generated, deterministic)

8 centres (PHCs + CHCs) across **Bareilly** district · 15 essential medicines · 90 days of
seasonal usage history · engineered shortage / surplus / near-expiry scenarios · beds, footfall,
doctors and tests per centre. Reseed anytime: `python backend/scripts/seed.py --reset`.

---

## Verified results (from `scripts/smoke_test.py`)

- ✅ 32/32 endpoint + lifecycle checks pass end-to-end
- 🔮 Forecast model **beats the moving-average baseline** on a time-split backtest (lower WAPE/MAE; margin varies by item)
- 🔁 ~54 explainable proposals per run (redistribution + return-to-store)
- 🔐 Full approval lifecycle exercised: verify → approve → assign → pickup → confirm → stock update, with 409/400 guard-rails and a per-transfer audit timeline
- 📥 SMS + CSV ingestion parse and record stock with confidence scoring
- 🚩 District view auto-flags under-resourced centres with bilingual reasons
- 🌐 Every recommendation/alert returned in both English and Hindi

---

## Project structure

```
Smart Health/
├── backend/          FastAPI · ML · optimisation · services · routers (see backend/README.md)
├── frontend/         Next.js dashboard · 12 screens · EN/हिंदी (see frontend/README.md)
├── docs/             PRD · SDD/HLD · Technical Spec · AI-ML Blueprint · UI/UX · Roadmap · API Contract · Governance Workflow
├── scripts/          dev.ps1 / dev.sh — start both services
├── docker-compose.yml
└── README.md
```

---

## Roadmap beyond MVP

Live HMIS/e-Aushadhi integration · SMS/IVR alerts for field staff · offline-first mobile app ·
QR/barcode stock scanning · route-optimised transfers · more languages.

---

Built as a hackathon-grade, production-minded reference for rural health-system operational intelligence.
