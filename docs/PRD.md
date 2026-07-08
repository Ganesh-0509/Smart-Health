# PRD.md
# Product Requirements Document

## 1. Product Name

**Smart Health (PHC Intelligence)**  
AI-driven PHC Inventory Optimization System for predictive demand planning and inter-PHC stock redistribution.

---

## 2. Document Purpose

This document defines **what to build** for the first version of the product.  
It explains the problem, users, goals, scope, features, data needs, success metrics, and launch criteria.

This PRD is written for a hackathon / prototype build, but with a design that can scale into a real operational product.

---

## 3. Product Vision

Build an intelligent inventory decision-support system for Primary Health Centres (PHCs) that can:

- Forecast medicine and supply demand.
- Detect shortage and expiry risk early.
- Recommend stock transfers between nearby PHCs.
- Reduce wastage and stockouts.
- Help rural health staff make faster and better logistics decisions.

The product should behave like a **digital decision layer** for PHC supply chains.

---

## 4. Problem Statement

Primary Health Centres in rural areas often operate with limited staff, manual inventory tracking, and no intelligent resupply coordination.  
As a result:

- Some PHCs run out of essential medicines unexpectedly.
- Other PHCs store excess stock that may expire unused.
- Staff spend time manually checking registers and calling nearby centres.
- Redistribution happens ad hoc, not through a data-driven process.
- Patient care is affected when critical supplies are unavailable.

The core problem is not just shortage — it is the **lack of predictive and coordinated inventory planning across PHCs**.

---

## 5. Why This Product Matters

This product matters because PHCs are low-resource healthcare nodes that need simple, high-impact tools.  
AI in primary care is increasingly being used for support functions and operational workflows, but the biggest gap remains in practical, explainable, low-cost systems that improve resource management rather than only diagnosis or telemedicine.[web:5][web:32]

WHO’s compendiums of innovative technologies for low-resource settings also emphasize solutions that address unmet needs in constrained environments and are suitable for practical deployment.[web:21][web:26]

This project fits that need because it is:
- Operational.
- Predictive.
- Lightweight.
- PHC-specific.
- Action-oriented.

---

## 6. Product Goals

### Primary goals
1. Predict future medicine/supply demand per PHC.
2. Identify stockout and expiry risks early.
3. Recommend redistribution across PHCs.
4. Show simple, explainable actions to users.
5. Reduce waste and service interruption.

### Secondary goals
1. Create a clean dashboard for PHC and district staff.
2. Enable manual or CSV-based data entry for MVP.
3. Support alerts through web, SMS, or email.
4. Maintain a history of inventory and transfer actions.

---

## 7. Non-Goals

This version will **not** include:
- Patient diagnosis.
- Telemedicine.
- Appointment booking.
- Chatbot-based medical advice.
- Personal health data processing.
- Full government system integration in MVP.
- Complex IoT barcode hardware dependence.

The product is strictly an **inventory intelligence and redistribution system**.

---

## 8. Target Users

### 8.1 PHC Pharmacist
- Updates stock.
- Reviews shortage alerts.
- Confirms outgoing or incoming transfer.

### 8.2 PHC Medical Officer
- Sees whether stock availability may affect care.
- Uses the system to plan ahead.

### 8.3 Block Health Manager
- Monitors multiple PHCs.
- Approves transfer plans.
- Identifies risk centres.

### 8.4 District Health Officer
- Views block-wide inventory health.
- Reviews waste, shortage, and transfer summaries.

### 8.5 Delivery/Dispatch Staff
- Uses route and pickup/delivery instructions.
- Confirms transfer completion.

---

## 9. Product Scope

## 9.1 MVP Scope
The first version should include:
- PHC master data.
- Inventory input.
- Historical usage input.
- Demand forecasting.
- Expiry and shortage detection.
- Redistribution recommendations.
- Dashboard and alerting.
- Transfer confirmation tracking.

## 9.2 Future Scope
- Multi-district scale.
- Direct HMIS integration.
- Mobile app offline mode.
- QR/barcode scanning.
- Route optimization with live traffic.
- Forecasting for more supply types.

---

## 10. Key Use Cases

### Use Case 1: Predict shortage
A PHC has low stock of ORS, antibiotics, or fever medicines.  
The system predicts when a shortage will happen and alerts the user before stockout.

### Use Case 2: Prevent expiry
A PHC has medicines nearing expiry with low predicted usage.  
The system recommends moving those items to a nearby PHC with expected demand.

### Use Case 3: Balance stock across PHCs
One PHC has excess stock; another has a deficit.  
The system proposes a transfer plan with suggested quantities and timing.

### Use Case 4: Reduce manual effort
Instead of calling each PHC manually, the manager sees a ready-made recommendation dashboard.

### Use Case 5: Audit and accountability
Every transfer recommendation and confirmation is logged for review.

---

## 11. Product Requirements

## 11.1 Functional Requirements

### FR1 — Inventory capture
The system must allow PHCs to record current stock levels by medicine/item and expiry batch.

### FR2 — Usage capture
The system must record historical item usage over time.

### FR3 — Demand forecasting
The system must generate demand forecasts per item and per PHC.

### FR4 — Risk detection
The system must flag:
- stockout risk,
- expiry risk,
- abnormal consumption spikes.

### FR5 — Redistribution recommendation
The system must recommend cross-PHC transfers when surplus and shortage conditions exist.

### FR6 — Transfer workflow
The system must allow users to accept, reject, or confirm a recommended transfer.

### FR7 — Alerting
The system must send alerts through dashboard notifications and optional SMS/email.

### FR8 — Reporting
The system must generate summaries for shortages, waste avoided, and completed transfers.

---

## 12. Data Requirements

## 12.1 Core datasets
- PHC master dataset.
- Inventory snapshots.
- Usage history.
- Expiry dates.
- Transfer history.
- PHC location coordinates.

## 12.2 Optional enrichment datasets
- Weather data.
- Calendar/holiday data.
- Local disease seasonality signals.
- Population/catchment size.
- Ambulance or transport availability.

## 12.3 MVP dataset strategy
If real data is unavailable:
- Use synthetic PHC inventory and usage data.
- Simulate seasonal demand patterns.
- Simulate expiry windows and transfer scenarios.

### Dataset quality expectation
For the project to be strong, the data should be:
- time-stamped,
- item-wise,
- PHC-wise,
- batch-aware,
- consistent,
- audit-friendly.

---

## 13. Best-fit Analytical Approach

For this product, the strongest practical approach is a **hybrid pipeline**:

### Forecasting layer
Use time-series and machine learning forecasting for item-level demand.

Best-fit model strategy:
- Baseline: moving average / exponential smoothing.
- Strong tabular model: XGBoost or LightGBM using lag features.
- Optional seasonal model: Prophet.
- Advanced benchmark: LSTM only if enough data exists.

### Optimization layer
Use constrained optimization for transfer planning.

Best-fit model strategy:
- Linear programming or OR-Tools.
- Objective: minimize shortage, expiry waste, and transport cost.
- Constraints: donor stock, receiver need, safety stock, transfer capacity.

### Why this is the right direction
Recent work on medicine and hospital inventory forecasting shows that comparing several forecasting methods is useful, but for practical deployment, a hybrid approach that combines prediction with optimization is more actionable than forecasting alone.[web:37][web:38][web:40][web:43][web:46]

---

## 14. User Experience Requirements

### UX1 — Simple dashboard
Users must see:
- current stock health,
- forecasted risk,
- recommended actions,
- confirmed transfers.

### UX2 — Minimal training
The system must use plain language and require minimal learning.

### UX3 — Low bandwidth support
The product should work well on basic internet connections.

### UX4 — Mobile-friendly
The interface must adapt to phones and tablets.

### UX5 — Explainability
Every recommendation must show a reason in simple text.

---

## 15. Success Metrics

The project should be measured by:

- Reduction in stockout incidents.
- Reduction in expired stock.
- Percentage of forecast accuracy improvement.
- Number of successful transfer recommendations.
- Reduction in manual coordination effort.
- User acceptance of recommendations.

### Example target metrics for MVP
- Forecast error below a reasonable baseline.
- At least 70% of recommendations accepted in simulation.
- Measurable reduction in simulated waste or shortage.

---

## 16. Constraints and Assumptions

### Constraints
- Limited real PHC data.
- Limited time for MVP.
- Possible poor data quality.
- Rural connectivity limitations.
- Need to avoid complex deployment.

### Assumptions
- PHCs can record stock once per day or once per shift.
- Some historical usage data is available or can be simulated.
- Transfer between PHCs is operationally possible within a block.
- Users can access a simple web UI.

---

## 17. Risks

- Poor data quality may reduce prediction accuracy.
- Users may not trust AI without explanations.
- Transfer suggestions may not be feasible in every case.
- The system may need customization per district.
- Real rollout may depend on government approval.

---

## 18. Product Principles

1. **Practicality first** — every feature must solve a real PHC problem.
2. **Explainability first** — users must understand why the system recommends something.
3. **Low-friction usage** — minimal manual work.
4. **PHC-centered design** — built for rural health logistics, not generic inventory.
5. **Action over analytics** — output should lead to a decision.

---

## 19. Release Criteria

The MVP is ready when:
- PHC stock can be uploaded or entered.
- Forecasts are generated successfully.
- Surplus/deficit is identified.
- Recommendations are created.
- Users can confirm a transfer.
- Dashboard and alerts work end to end.

---

## 20. Final Product Summary

Smart Health (PHC Intelligence) is an AI-powered PHC inventory optimization system that predicts future supply needs and recommends cross-PHC redistribution to reduce shortage and waste.  
The product is designed for low-resource rural healthcare settings and focuses on practical, explainable operational planning.

---

## 21. Citation note for positioning
AI in primary care is already being explored across administrative support, drug management, and practice management, but PHC-specific inventory optimization with redistribution remains a much narrower and more differentiated use case.[web:32][web:5]
WHO’s low-resource technology compendiums support the value of practical, unmet-need solutions for constrained settings.[web:21][web:26]