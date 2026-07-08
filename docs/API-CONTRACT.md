# Smart Health — API Contract (v1)

This is the **single source of truth** for the REST API. Backend and frontend are built against this document.

- **Base URL (dev):** `http://localhost:8000`
- **All endpoints prefixed:** `/api`
- **Format:** JSON. `Content-Type: application/json`.
- **CORS:** backend allows `http://localhost:3000`.
- **Auth (MVP):** no real auth. A `role` and `phc_id` are passed as query params / headers to simulate role-based views. Header: `X-Role`, `X-PHC-Id` (optional).
- **Language:** endpoints returning human-readable text accept `?lang=en|hi` (default `en`). Objects with text also carry both `*_en` and `*_hi` fields so the client can switch instantly without refetch.

Enums:
- `phc_type`: `PHC` | `CHC`
- `risk_level`: `healthy` | `warning` | `critical`
- `urgency`: `low` | `medium` | `high` | `critical`
- `recommendation_status`: `pending` | `approved` | `rejected` | `completed`
- `doctor_status`: `present` | `absent` | `on_leave`
- `role`: `pharmacist` | `medical_officer` | `block_manager` | `district_officer` | `admin`

---

## Health / Meta

### `GET /api/health`
```json
{ "status": "ok", "service": "smart-health-api", "version": "1.0.0", "time": "2026-07-08T10:00:00Z" }
```

### `GET /api/meta/i18n`
Returns the shared UI dictionary (keys → {en, hi}). Optional convenience for the client.

---

## Master data

### `GET /api/phcs`
Query: `district?`, `block?`, `type?`
```json
[
  {
    "phc_id": "PHC-01", "name": "Rampur PHC", "type": "PHC",
    "block": "Rampur", "district": "Bareilly",
    "latitude": 28.81, "longitude": 79.02,
    "catchment_population": 32000, "priority_level": 2
  }
]
```

### `GET /api/phcs/{phc_id}` → single PHC object (as above).

### `GET /api/medicines`
```json
[
  { "medicine_id": "MED-01", "name": "ORS Sachet", "unit": "sachet",
    "category": "Oral Rehydration", "critical": true, "min_safety_stock": 200 }
]
```

---

## Dashboard

### `GET /api/dashboard/summary`
Query: `phc_id?` (omit = whole district), `lang?`
```json
{
  "scope": "district",
  "phc_id": null,
  "kpis": {
    "items_at_shortage_risk": 7,
    "items_near_expiry": 4,
    "pending_recommendations": 5,
    "beds_available": 42,
    "beds_total": 70,
    "doctors_present": 11,
    "doctors_expected": 15,
    "footfall_today": 620,
    "tests_unavailable": 3,
    "active_alerts": 9
  },
  "stock_health": { "healthy": 120, "warning": 22, "critical": 9 },
  "demand_trend": [ { "date": "2026-07-01", "predicted": 180, "actual": 172 } ],
  "top_alerts": [
    { "id": "AL-1", "type": "shortage", "risk_level": "critical",
      "phc_id": "PHC-03", "title_en": "ORS shortage in 3 days", "title_hi": "ORS 3 दिनों में समाप्त",
      "message_en": "...", "message_hi": "..." }
  ]
}
```

### `GET /api/dashboard/phc/{phc_id}` → same shape, `scope:"phc"`.

---

## Inventory

### `GET /api/inventory`
Query: `phc_id?`, `medicine_id?`, `risk_level?`
```json
[
  {
    "phc_id": "PHC-01", "phc_name": "Rampur PHC",
    "medicine_id": "MED-01", "medicine_name": "ORS Sachet",
    "stock_qty": 150, "min_safety_stock": 200,
    "batch_no": "B2451", "expiry_date": "2026-09-15", "days_to_expiry": 69,
    "snapshot_date": "2026-07-08",
    "avg_daily_usage": 34.2, "days_of_cover": 4.4,
    "risk_level": "critical", "near_expiry": false,
    "updated_via": "barcode", "data_confidence": "high",
    "confidence_reason_en": "Updated today via barcode/system sync.",
    "confidence_reason_hi": "आज बारकोड/सिस्टम सिंक से अपडेट किया गया।"
  }
]
```
`data_confidence` ∈ `high|medium|low|very_low` (from how/when the stock was captured).
PHC objects also carry `digital_maturity` ∈ `app|smartphone|sms`.
Medicine objects carry `cold_chain` (bool) and `storage_condition`.

### `GET /api/inventory/risk`
Query: `lang?` — items at shortage or expiry risk, sorted worst-first. Same item shape plus `reason_en`, `reason_hi`.

---

## Forecast

### `GET /api/forecast`
Query: `phc_id` (req), `medicine_id` (req), `horizon?` (default 14)
```json
{
  "phc_id": "PHC-01", "medicine_id": "MED-01", "horizon_days": 14,
  "model": "gradient_boosting", "model_version": "1.0.0",
  "history": [ { "date": "2026-06-20", "usage": 30 } ],
  "forecast": [ { "date": "2026-07-09", "predicted": 33.5, "lower": 27.1, "upper": 39.9 } ],
  "risk_score": 0.78,
  "explain": {
    "top_factors_en": ["7-day usage trend rising", "monsoon season", "stock below safety level"],
    "top_factors_hi": ["7-दिन उपयोग बढ़ रहा है", "मानसून मौसम", "स्टॉक सुरक्षा स्तर से नीचे"]
  }
}
```

### `GET /api/forecast/metrics`
```json
{ "model": "gradient_boosting", "baseline": "moving_average",
  "metrics": { "MAE": 5.2, "RMSE": 7.1, "MAPE": 13.4, "WAPE": 11.8, "bias": -0.6 },
  "baseline_metrics": { "MAE": 8.9, "RMSE": 11.2, "MAPE": 22.1, "WAPE": 19.7, "bias": 1.2 },
  "improvement_pct": 41.6 }
```

---

## Recommendations (redistribution) — human-in-the-loop workflow

**The AI never moves stock.** It emits an explainable *draft* proposal
(`status: "awaiting_verification"`). Humans then drive the state machine:

```
awaiting_verification --verify--> awaiting_approval --approve--> approved
   --assign--> assigned --pickup--> picked_up --confirm--> stock_updated
```
Any non-terminal state can be rejected (reason required). Terminal: `stock_updated`, `rejected`.

Additional enums:
- `transfer_type`: `redistribution` | `return_to_store`
- `logistics_model`: `piggyback` | `hub_and_spoke` | `emergency_lateral` | `return_to_store`
- `escalation_level`: `none` | `supervisor` | `district_officer` | `emergency`
- `confidence` (data confidence): `high` | `medium` | `low` | `very_low`

### `GET /api/recommendations`
Query: `status?` (any status, or `open` = all in-flight), `phc_id?`, `transfer_type?`, `lang?` — sorted by `priority_score` desc.
```json
[
  {
    "recommendation_id": "REC-006", "transfer_type": "redistribution",
    "source_phc_id": "PHC-04", "source_phc_name": "Bhojipura PHC",
    "target_phc_id": "PHC-05", "target_phc_name": "Nawabganj CHC",
    "medicine_id": "MED-10", "medicine_name": "Albendazole", "unit": "tablet",
    "suggested_qty": 232, "urgency": "critical", "priority_score": 0.93, "distance_km": 9.0,
    "batch_no": "B4821", "expiry_date": "2026-08-11", "cold_chain": false,
    "storage_condition": "Room temperature",
    "predicted_stockout_date": "2026-07-09", "source_buffer_days_after": 30.0,
    "logistics_model": "emergency_lateral", "emergency": true, "escalation_level": "emergency",
    "confidence": "low",
    "confidence_reason_en": "Physical verification required before approval. Stock last updated 6 days ago.",
    "confidence_reason_hi": "स्वीकृति से पहले भौतिक सत्यापन आवश्यक। स्टॉक 6 दिन पहले अपडेट किया गया।",
    "reason_en": "Nawabganj CHC is projected to run out of Albendazole in ~1 days, while Bhojipura PHC holds surplus stock expiring in 34 days and will still retain a 30-day buffer after transferring 232 tablet.",
    "reason_hi": "...",
    "expected_benefit_en": "Prevents a stockout at Nawabganj and avoids waste at Bhojipura.",
    "expected_benefit_hi": "...",
    "status": "awaiting_verification",
    "verified_by": null, "verified_at": null, "verified_qty": null,
    "approved_by": null, "approved_at": null, "actual_qty": null,
    "assigned_at": null, "pickup_by": null, "picked_up_at": null,
    "received_qty": null, "received_condition": null, "delivered_at": null,
    "stock_updated_at": null, "reject_reason": null, "modify_reason": null,
    "created_at": "2026-07-08T09:00:00Z"
  }
]
```
A `return_to_store` item has `target_phc_id: "STORE-DIST"`, `target_phc_name: "Block/District Store"`,
`predicted_stockout_date: null`, `escalation_level: "district_officer"`.

### `POST /api/recommendations/generate`  Body: `{ "phc_id": null }` → runs optimizer, returns new list.

### `GET /api/recommendations/{id}/timeline`
Audit trail. `[ { "event":"created","actor":"ai_engine","note":"...","at":"...Z" }, ... ]`
Events: `created|verified|approved|rejected|assigned|picked_up|confirmed|stock_updated|emergency_marked|returned_to_verification`.

### `GET /api/recommendations/{id}/briefing`
Query: `lang?` — a plain-language **bilingual** justification of the transfer, written for the approver.
Generated by **Gemini** when `GEMINI_API_KEY` is configured; otherwise falls back to the
recommendation's own `reason_*` / `expected_benefit_*` fields. Advisory only — it never changes
the human-approval requirement.
```json
{ "recommendation_id": "REC-006", "source": "gemini",
  "briefing_en": "Nawabganj CHC will run out of Albendazole in about a day. Bhojipura PHC has surplus expiring in 34 days and keeps a 30-day buffer after sending 232 tablets, so approving this transfer prevents a stockout and avoids waste.",
  "briefing_hi": "..." }
```
`source` ∈ `gemini | fallback`.

### State-machine transitions (all return the updated recommendation)
| Endpoint | Body | From → To |
|---|---|---|
| `POST /{id}/verify` | `{ verified_by, confirmed_qty?, note? }` | awaiting_verification → awaiting_approval |
| `POST /{id}/request-verification` | `{ actor }` | awaiting_approval → awaiting_verification |
| `POST /{id}/approve` | `{ approved_by, actual_qty?, modify_reason? }` | awaiting_approval → approved |
| `POST /{id}/reject` | `{ rejected_by, reason }` **(reason required, 400 if empty)** | any open → rejected |
| `POST /{id}/assign` | `{ actor, logistics_model? }` | approved → assigned |
| `POST /{id}/pickup` | `{ pickup_by }` | assigned → picked_up |
| `POST /{id}/confirm` | `{ received_by, received_qty?, received_condition }` | picked_up → stock_updated (updates inventory) |
| `POST /{id}/mark-emergency` | `{ actor }` | any open (sets `emergency`, escalation) |

Invalid transitions return **409**. Emergencies may be approved directly from `awaiting_verification`.

---

## Ingestion (low-connectivity fallbacks)

### `POST /api/ingest/sms`
Body: `{ "message": "STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A", "phc_id?": null }`
Also accepts short form `"PHC-05 Paracetamol 300 09-2026"`. Records a stock snapshot (`updated_via:"sms"`).
Free-form/messy texts a regex can't parse (e.g. `"we have about 120 ORS packets expiring december"`)
are parsed by **Gemini** when a `GEMINI_API_KEY` is configured; otherwise the strict regex parser runs
offline. The response reports which path handled it via `parsed_by`.
```json
{ "ok": true, "phc_id": "PHC-03", "medicine_id": "MED-01", "medicine_name": "ORS Sachet",
  "stock_qty": 120, "batch_no": "ORS24A", "expiry_date": "2026-12-28",
  "updated_via": "sms", "data_confidence": "low", "parsed_by": "regex",
  "note_en": "Recorded via SMS — physical verification advised before transfer.",
  "note_hi": "..." }
```
`parsed_by` ∈ `gemini | regex` — indicates whether the message was interpreted by Gemini or the offline regex parser.

### `POST /api/ingest/csv`
Body: `{ "csv": "phc_id,medicine_id,stock_qty,batch_no,expiry_date,snapshot_date\n..." }`
→ `{ "ok": true, "inserted": 12, "errors": [], "updated_via": "csv", "data_confidence": "medium" }`

---

## Alerts

### `GET /api/alerts`
Query: `phc_id?`, `type?` (`shortage|expiry|spike|transfer_due|bed_full|doctor_absent|test_down`), `lang?`
```json
[
  { "id": "AL-1", "type": "shortage", "risk_level": "critical",
    "phc_id": "PHC-03", "phc_name": "Sadar CHC",
    "title_en": "ORS shortage imminent", "title_hi": "ORS की कमी आसन्न",
    "message_en": "Projected stockout in 3 days.", "message_hi": "3 दिनों में स्टॉक समाप्त होने का अनुमान।",
    "created_at": "2026-07-08T08:00:00Z" }
]
```

---

## Reports

### `GET /api/reports/summary`
Query: `lang?`
```json
{
  "waste_avoided_units": 640, "waste_avoided_value": 12800,
  "stockouts_prevented": 14, "transfer_completion_rate": 0.82,
  "recommendation_acceptance_rate": 0.74,
  "top_risky_medicines": [ { "medicine_id":"MED-01","name":"ORS Sachet","risk_score":0.88 } ],
  "top_risky_phcs": [ { "phc_id":"PHC-03","name":"Sadar CHC","health_score":0.42 } ],
  "trend": [ { "week":"2026-W26","stockouts":5,"waste":90 } ]
}
```

---

## Operational modules (beds / footfall / doctors / tests)

### `GET /api/beds`  Query: `phc_id?`
```json
[
  { "phc_id":"PHC-01","phc_name":"Rampur PHC",
    "total_beds":20,"occupied_beds":13,"available_beds":7,
    "general": {"total":14,"occupied":9}, "icu": {"total":2,"occupied":2},
    "maternity": {"total":4,"occupied":2},
    "occupancy_rate":0.65, "status":"warning", "updated_at":"2026-07-08T07:30:00Z" }
]
```

### `GET /api/footfall`  Query: `phc_id?`, `days?` (default 14)
```json
{
  "phc_id":"PHC-01",
  "today": { "opd":180, "ipd":14, "emergency":6, "total":200 },
  "series": [ { "date":"2026-07-01","opd":160,"total":178 } ],
  "avg_daily": 172, "peak_hour": "10:00-11:00"
}
```
If `phc_id` omitted → `series` is district-aggregated and `by_phc` array added.

### `GET /api/doctors`  Query: `phc_id?`
```json
[
  { "phc_id":"PHC-01","phc_name":"Rampur PHC",
    "doctor_name":"Dr. A. Sharma","specialty":"General Medicine",
    "status":"present","expected":true,"since":"2026-07-08T09:00:00Z" }
]
```
Also: `GET /api/doctors/summary?phc_id=` → `{ "present":11,"absent":3,"on_leave":1,"expected":15,"attendance_rate":0.73 }`

### `GET /api/tests`  Query: `phc_id?`, `available?`
```json
[
  { "phc_id":"PHC-01","phc_name":"Rampur PHC",
    "test_name":"Malaria RDT","category":"Rapid Diagnostic",
    "available":false, "reason_en":"Kit stock exhausted","reason_hi":"किट स्टॉक समाप्त",
    "updated_at":"2026-07-08T06:00:00Z" }
]
```

---

## District intelligence

### `GET /api/district/overview`  Query: `lang?`
Auto-flags under-performing / under-resourced centres for intervention.
```json
{
  "district": "Bareilly",
  "phc_scores": [
    { "phc_id":"PHC-03","name":"Sadar CHC","type":"CHC",
      "latitude":28.85,"longitude":79.10,
      "health_score":0.42, "risk_level":"critical",
      "stock_risk":0.7,"bed_pressure":0.9,"doctor_gap":0.4,"test_gap":0.5,
      "flagged":true,
      "flag_reason_en":"High bed pressure + 3 stockout risks + 2 tests down",
      "flag_reason_hi":"अधिक बेड दबाव + 3 स्टॉक जोखिम + 2 टेस्ट बंद" }
  ],
  "flagged_count": 3,
  "district_kpis": { "avg_health_score":0.68, "total_phcs":8, "critical_phcs":3 }
}
```

---

## Assistant — "Ask the district" (Gemini-powered, with fallback)

Natural-language Q&A over a live data snapshot (district overview + critical stock + near-expiry +
open transfers). Answers are generated by **Gemini** when `GEMINI_API_KEY` is configured; otherwise
a deterministic summary of the same snapshot is returned. Advisory only — read-only, moves no stock.

### `POST /api/assistant/ask`
Body: `{ "question": "Which centres are most at risk of an ORS stockout this week?", "lang?": "en" }`
```json
{ "answer": "Sadar CHC (PHC-03) is the highest ORS stockout risk...",
  "lang": "en", "mode": "live" }
```
`mode` ∈ `live | fallback` — `live` = answered by Gemini, `fallback` = deterministic summary.

### `GET /api/assistant/status`
Reports whether Gemini is enabled and which mode the assistant is running in.
```json
{ "gemini_enabled": true, "model": "gemini-2.0-flash", "mode": "live" }
```

---

## Error shape
```json
{ "detail": "Human-readable error message", "code": "not_found" }
```
Standard HTTP status codes: 200, 201, 400, 404, 422, 500.
