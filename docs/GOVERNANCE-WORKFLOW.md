# Governance & Human-in-the-Loop Workflow

> **Core principle:** *The system does not autonomously move medical inventory.*
> It generates explainable, expiry-aware, demand-aware transfer proposals.
> Final authority stays with the District/Block Health Officer or authorised supervisor.

Medicine stock is government property. Its movement involves batch numbers, expiry
dates, cold-chain rules, minimum buffer stock, and accountability. So the AI is a
**decision-support engine**, never an autonomous stock controller. This document
defines exactly where autonomy stops and human authority begins.

---

## 1. Autonomy matrix

| Stage | AI automatic? | Human needed? |
|---|:---:|:---:|
| Detect low stock / expiry risk | ✅ | — |
| Forecast future demand | ✅ | — |
| Suggest source PHC + receiver PHC | ✅ | — |
| Create **draft** transfer order | ✅ | — |
| Physically move stock | ❌ | ✅ |
| Approve government stock transfer | ❌ | ✅ |
| Confirm received quantity / condition | ❌ | ✅ |

**Judge-facing line:** *"AI detects risk → creates an explainable transfer recommendation →
PHC verifies stock → supervisor approves/modifies/rejects → logistics executes →
receiver confirms → stock updates. Approval always stays with a human."*

---

## 2. Approval state machine

```
awaiting_verification ──verify──▶ awaiting_approval ──approve──▶ approved
        │                                │                          │
        │                                │                       assign
        ▼ reject (reason)                ▼ reject / request re-verify ▼
     rejected ◀──────────────────────────────────────────────  assigned
                                                                   │ pickup
                                                                   ▼
                                                               picked_up ──confirm──▶ stock_updated
```

Every transition is recorded as an immutable `TransferEvent` (actor + timestamp + note),
producing a complete audit trail (`GET /api/recommendations/{id}/timeline`). Invalid
transitions are rejected (HTTP 409). A **rejection requires a reason** (HTTP 400 if empty).
Emergencies may be fast-tracked to approval directly from verification.

Full lifecycle: **Awaiting Verification → Awaiting Approval → Approved → Assigned →
Picked Up → Delivered → Confirmed → Stock Updated.**

---

## 3. Escalation rules

The system never blind-auto-approves. Instead it escalates:

| Condition | System action |
|---|---|
| Stockout predicted within 7 days | Notify supervisor (`escalation: supervisor`) |
| No response in 24 hours | Escalate to district officer |
| Stockout predicted within 48 hours | Mark **emergency** (`escalation: emergency`, fast-track) |
| Expiry within 30 days and no recipient | Recommend **return to block/district store** |
| Supervisor rejects | Require a reason (logged) |
| Stock situation changes | Recalculate the recommendation |

---

## 4. Logistics execution models

We do **not** build a parallel logistics fleet. We attach redistribution tasks to
existing district supply operations. Each recommendation is assigned one model:

| Model | When used | How it moves |
|---|---|---|
| **Piggyback** (`piggyback`) | Routine surplus/deficit | Rides the existing warehouse→PHC supply run (District Store → PHC A → PHC B) |
| **Hub-and-spoke** (`hub_and_spoke`) | Cold-chain, high-value, batch-verification, or long distance | PHC A surplus → Block/District Store → PHC B deficit; warehouse stays the control point |
| **Emergency lateral** (`emergency_lateral`) | Imminent stockout (≤2 days) after fast-track approval | Direct nearby PHC→PHC after supervisor sign-off |
| **Return to store** (`return_to_store`) | Near-expiry surplus with no nearby receiver | Return to block/district store for reallocation or supplier handling |

Assignment logic: emergency (receiver ≤2 days cover) → *emergency lateral*; cold-chain OR
distance > 40 km OR critical+large qty → *hub-and-spoke*; else → *piggyback*; no receiver +
near-expiry → *return to store*.

---

## 5. Data confidence (don't blindly trust stock entries)

Every stock figure is scored by **how** and **how recently** it was captured. Weak data
must be physically re-verified before approval.

| Data condition | Confidence |
|---|---|
| Updated today via barcode / system sync | **High** |
| Updated within 3 days, manual entry | **Medium** |
| Last updated 4–10 days ago | **Low** |
| Stale (>10 days) or SMS-only | **Very low** |

A recommendation inherits the **weaker** confidence of its source and target. When it is
not `high`, the UI shows *"Physical verification required before approval."* This is the
answer to inaccurate demand estimation and last-mile stock mismatch.

---

## 6. Data captured for every transfer (auditability)

Transfer ID · source PHC · destination · item · quantity · **batch number** · **expiry date** ·
storage condition · **cold-chain requirement** · reason · predicted stockout date · source
remaining buffer (days after transfer) · confidence · approved by · pickup person/vehicle ·
pickup timestamp · delivery timestamp · receiver confirmation (qty + condition) ·
rejection/modification reason. *Without batch and expiry tracking, the system is not serious —
it becomes a fancy to-do list.*

---

## 7. Digital maturity — designed for real rural PHCs

We do **not** assume every PHC has a desktop, stable internet, and a trained operator.
Three tiers are supported (each PHC carries a `digital_maturity` flag):

| Tier | Input path |
|---|---|
| **Level 1 — Fully digital** (`app`) | Web dashboard / PWA, barcode-QR entry, daily sync, approval queue |
| **Level 2 — Smartphone-only** (`smartphone`) | Android-first app, offline entry, sync when online, local-language UI, photo/barcode |
| **Level 3 — Low-connectivity** (`sms`) | **SMS** stock update, IVR/phone, paper register + weekly district CSV upload, supervisor-on-behalf entry |

Implemented fallbacks (see the API): `POST /api/ingest/sms` parses e.g.
`STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A` (or short `PHC-05 Paracetamol 300 09-2026`),
and `POST /api/ingest/csv` accepts a district CSV upload. Precedent: India's **eVIN** digitised
vaccine stock using smartphones + cloud and trained 41,000+ cold-chain handlers.

---

## 8. Government-platform integration (intelligence layer, not a replacement)

Positioned as an intelligence layer *on top of* existing systems — integrate where digital
stock systems exist, provide the lightweight mobile/SMS fallback where they don't.

| Platform | How we use it |
|---|---|
| **DVDMS / e-Aushadhi** | Pull stock, issue, consumption, warehouse & PHC inventory |
| **HMIS** | Facility service / patient-flow indicators as demand signals |
| **eVIN-style model** | Mobile stock + temperature monitoring workflow |
| **DHIS2 Logistics / eLMIS** | Facility/community stock reporting, barcode real-time stock |
| **eSushrut@Clinic** | Lightweight facility-side interface for small clinics |

Existing systems mostly answer *"Where is the stock?"* Our differentiator answers:
**"Given expiry, demand, distance, and buffer stock, where should stock move next — and who must approve it?"**

---

## 9. Generative AI (Gemini) is advisory only

Two features use Google **Gemini**: plain-language **supervisor briefings**
(`GET /api/recommendations/{id}/briefing`) and **natural-language SMS parsing** of messy stock
texts (`POST /api/ingest/sms`). Both fit the *"AI proposes, humans decide"* principle — they are
**strictly advisory** and change nothing about the workflow above:

- A briefing only **explains** an existing recommendation in plain language; it never creates,
  approves, or moves a transfer. The human-approval state machine (§2) is untouched.
- NL-parsed SMS is recorded exactly like any other SMS snapshot — **low data confidence** (§5),
  so physical verification is still required before approval.
- Both degrade gracefully: with no `GEMINI_API_KEY`, briefings fall back to the recommendation's own
  reason fields and SMS falls back to the offline regex parser. No AI key is ever required to operate.

Gemini adds clarity, not authority. The supervisor still decides.

---

## 10. One-paragraph positioning

> *"Our platform is a human-in-the-loop redistribution intelligence layer. It works with
> existing PHC stock systems, predicts stockout and expiry risk, recommends transfer plans,
> routes them through supervisor approval with full batch-level auditability, and executes
> them using existing district logistics. The AI proposes; the supervisor decides; the system
> remembers."*
