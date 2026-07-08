# Smart Health — Frontend

AI-driven **control room for PHC stock planning**. A polished Next.js dashboard for
Primary Health Centre inventory optimization, forecasting, redistribution, and
operational monitoring (beds, footfall, doctors, tests, district intelligence).

Built for the Smart Health hackathon against [`API-CONTRACT.md`](../docs/API-CONTRACT.md)
and [`UI-UX-Design-System.md`](../docs/UI-UX-Design-System.md).

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (custom medical color semantics)
- **recharts** (charts), **lucide-react** (icons), **clsx**
- System font stack (no external fonts — works offline)

## Robustness: works with or without the backend

Every API call in `lib/api.ts` targets `${NEXT_PUBLIC_API_URL}/api/...`
(default `http://localhost:8000`). If a request fails (backend down, timeout,
non-2xx), it **automatically falls back to realistic mock data** from
`lib/mock.ts`, logs a small `console.warn`, and the page still renders. A
"showing demo data" banner appears on affected screens. This means the frontend
runs standalone in a live demo even before the backend is up.

## Getting started

```bash
cd frontend
cp .env.local.example .env.local   # optional; defaults to http://localhost:8000
npm install
npm run dev                        # http://localhost:3000
```

### Scripts

| Script          | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server (port 3000) |
| `npm run build` | Production build                 |
| `npm start`     | Serve the production build       |
| `npm run lint`  | ESLint (next/core-web-vitals)    |

Typecheck without emitting: `npx tsc --noEmit`.

## Configuration

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The client calls `${NEXT_PUBLIC_API_URL}/api/...`. CORS on the backend must allow
`http://localhost:3000` (per the API contract).

## Features

- **Role selection / login** (`/`) — pharmacist, medical officer, block manager,
  district officer, admin. Stored in localStorage via app context; no real auth.
- **Dashboard** (`/dashboard`) — KPI cards (stock risk, expiry, pending
  recommendations, beds, doctors, footfall, tests, alerts), stock-health donut,
  demand trend, top alerts, quick links.
- **Inventory** (`/inventory`) — sortable table with risk badges, days-of-cover,
  near-expiry flags, filters; row click opens the forecast.
- **Forecast** (`/forecast`) — PHC + medicine selectors, history + predicted
  confidence band chart, model-vs-baseline metrics, explainability "why" panel.
- **Recommendations** (`/recommendations`) — AI redistribution cards with
  approve / reject / adjust-quantity actions and a Regenerate button.
- **Alerts** (`/alerts`) — colored severity banners, filter by type.
- **Reports** (`/reports`) — waste avoided, stockouts prevented, acceptance rate,
  top risky medicines/PHCs, trend chart, **client-side CSV export**.
- **Beds / Footfall / Doctors / Tests** — operational monitoring modules.
- **District** (`/district`) — per-PHC health scores with a lightweight
  CSS/SVG marker map and a sortable table; **flagged under-resourced centres**
  highlighted for intervention.

## Multilingual (English / हिंदी)

- Global language toggle in the top nav; persisted in localStorage.
- UI chrome strings live in `lib/i18n.ts` (`en` + `hi`).
- API objects carrying `*_en` / `*_hi` fields (reasons, alert titles, flag
  reasons, factors) render in the active language via `pickLang`. Requests also
  pass `?lang=` where the contract supports it.

## Project structure

```
frontend/
├─ app/
│  ├─ layout.tsx            # root layout + AppProvider
│  ├─ globals.css           # Tailwind + base styles
│  ├─ page.tsx              # login / role selection
│  └─ (app)/                # authenticated shell (sidebar + top nav)
│     ├─ layout.tsx
│     ├─ dashboard/ inventory/ forecast/ recommendations/
│     ├─ alerts/ reports/ beds/ footfall/ doctors/ tests/ district/
├─ components/              # Sidebar, TopNav, MetricCard, AlertBanner,
│                           # RecommendationCard, StatusBadge, TrendChart,
│                           # DataTable, LanguageToggle, RiskBadge, charts, …
├─ lib/
│  ├─ api.ts                # typed client with mock fallback
│  ├─ mock.ts               # realistic demo data for every endpoint
│  ├─ types.ts              # types mirroring the API contract
│  ├─ i18n.ts               # en/hi dictionary
│  ├─ context.tsx           # role / language / PHC scope
│  ├─ useApi.ts             # loading / error / mock hook
│  └─ format.ts             # number, date, semantic helpers
└─ tailwind.config.ts
```

## Design notes

- Semantic colors: green = healthy, amber = warning, red = critical/urgent,
  blue = info, gray = secondary. Color is never the only signal (icons + labels).
- Persistent sidebar (collapsible on mobile), sticky top bar with role, language
  toggle, and PHC scope selector.
- Every screen supports loading (skeletons), empty, and error states.
- Mobile-first and responsive; wide tables scroll inside their own container.
