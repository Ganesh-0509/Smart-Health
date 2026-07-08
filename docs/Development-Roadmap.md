# Development-Roadmap.md
# Development Roadmap

## 1. Purpose

This document defines the build order, milestones, and execution plan for the PHC Inventory Optimization System.  
The roadmap is optimized for a fast MVP first, followed by expansion into a more complete product.

A focused MVP with one core job-to-be-done, strong analytics, and a feedback loop is the most reliable way to launch a new software product quickly and learn from real usage.[web:84][web:87][web:88]

---

## 2. Roadmap Strategy

The best strategy for this project is:

1. Build the core workflow first.
2. Prove forecasting and optimization.
3. Add dashboard and alerts.
4. Add reports and explainability.
5. Stabilize and polish.

For healthcare inventory software, automation and reduction of human error are important early wins, so the first version should prioritize stock visibility, alerts, and replenishment logic.[web:86][web:89][web:90]

---

## 3. Phase 0 — Discovery

### Goal
Finalize the exact MVP scope.

### Tasks
- Select 2–3 PHCs for the demo model.
- Choose 10–20 important medicines.
- Define the minimum data fields.
- Decide the output format.
- Freeze the user roles.

### Deliverables
- final scope document,
- medicine list,
- sample PHC list,
- sample data schema.

### Exit criteria
- All team members agree on the same MVP.

---

## 4. Phase 1 — Data Foundation

### Goal
Create a reliable data model and seed data.

### Tasks
- Design PostgreSQL schema.
- Create CSV templates.
- Prepare synthetic PHC inventory data.
- Prepare synthetic usage history.
- Add PHC master and medicine master tables.

### Deliverables
- DB schema,
- CSV files,
- seeded test database.

### Exit criteria
- Data can be uploaded and stored correctly.

---

## 5. Phase 2 — Backend Core

### Goal
Build the main API layer.

### Tasks
- Create FastAPI project structure.
- Implement upload endpoints.
- Implement read endpoints.
- Add validation and error handling.
- Connect backend to database.

### Deliverables
- working API server,
- inventory ingestion flow,
- basic status endpoints.

### Exit criteria
- Data can move from input to database and back.

---

## 6. Phase 3 — Forecasting Engine

### Goal
Predict demand for medicines per PHC.

### Tasks
- Build baseline moving average model.
- Create lag and rolling features.
- Train LightGBM/XGBoost forecasting model.
- Benchmark against Prophet.
- Store forecast outputs in DB.

### Deliverables
- trained forecast model,
- forecast output table,
- model metrics report.

### Exit criteria
- Demand forecast can be generated for test PHCs.

---

## 7. Phase 4 — Optimization Engine

### Goal
Turn forecasts into redistribution plans.

### Tasks
- Define shortage and surplus rules.
- Set safety stock thresholds.
- Implement OR-Tools optimization.
- Add transfer cost logic.
- Rank transfer recommendations.

### Deliverables
- optimization module,
- transfer recommendation output,
- donor/receiver logic.

### Exit criteria
- The system can suggest who should send what to whom.

---

## 8. Phase 5 — Frontend Dashboard

### Goal
Provide a clean operational UI.

### Tasks
- Build login and role routing.
- Build dashboard cards.
- Build PHC detail page.
- Build recommendations page.
- Build alerts and report pages.

### Deliverables
- UI screens,
- reusable components,
- responsive layout.

### Exit criteria
- A user can understand the system in one glance.

---

## 9. Phase 6 — Explainability Layer

### Goal
Make recommendations trustworthy.

### Tasks
- Add reason text to each recommendation.
- Add feature importance output.
- Add confidence/risk labels.
- Add “why this was recommended” panel.

### Deliverables
- explainability strings,
- model explanation output,
- action reasoning display.

### Exit criteria
- Every action has a clear human-readable reason.

---

## 10. Phase 7 — Alerts and Notification

### Goal
Notify users when action is needed.

### Tasks
- Add dashboard notifications.
- Add email/SMS alert hooks.
- Trigger shortage and expiry warnings.
- Trigger transfer approval reminders.

### Deliverables
- alert service,
- notification rules,
- pending action queue.

### Exit criteria
- Users are informed without needing to search manually.

---

## 11. Phase 8 — Reports and Analytics

### Goal
Show operational impact.

### Tasks
- Build waste reduction report.
- Build stockout reduction report.
- Build transfer history report.
- Build PHC risk summary.

### Deliverables
- analytics pages,
- exportable report views,
- KPI cards.

### Exit criteria
- Users can see what the system has improved.

---

## 12. Phase 9 — Testing and Stabilization

### Goal
Make the product demo-safe and reliable.

### Tasks
- Test forecast outputs.
- Test optimization logic.
- Test empty and error states.
- Test approval workflow.
- Fix layout issues.

### Deliverables
- QA checklist,
- bug fixes,
- polished demo build.

### Exit criteria
- End-to-end workflow works without major failure.

---

## 13. Phase 10 — Hackathon Demo Preparation

### Goal
Prepare a strong final presentation.

### Tasks
- Create demo scenario.
- Prepare sample screenshots.
- Prepare before/after impact visuals.
- Prepare a 2–3 minute story.
- Freeze final code and data.

### Deliverables
- final demo,
- pitch deck,
- sample output,
- final README.

### Exit criteria
- Judges can understand the value in under 2 minutes.

---

## 14. Suggested Sprint Plan

## Sprint 1
- Discovery.
- Data model.
- Synthetic data.
- Backend skeleton.

## Sprint 2
- Forecasting model.
- Optimization engine.
- API endpoints.

## Sprint 3
- Frontend dashboard.
- Recommendation UI.
- Alert system.

## Sprint 4
- Explainability.
- Reports.
- Testing.
- Demo polish.

---

## 15. Build Order Priority

Build in this order:

1. Data schema.
2. Sample dataset.
3. Forecasting baseline.
4. Optimization engine.
5. Transfer recommendation storage.
6. Dashboard UI.
7. Explainability.
8. Alerts.
9. Reports.
10. Demo polish.

This order reduces risk because the core intelligence exists before visual polish.

---

## 16. Milestones

### Milestone 1
Data upload and database storage work.

### Milestone 2
Forecasts are generated for at least one medicine.

### Milestone 3
Optimization produces at least one valid transfer suggestion.

### Milestone 4
Dashboard shows recommendations.

### Milestone 5
Alerts and confirmation workflow work.

### Milestone 6
Reports and explainability are visible.

### Milestone 7
Demo is complete.

---

## 17. Team Role Split

### Product / PM
- scope,
- coordination,
- demo story,
- documentation.

### Backend Engineer
- API,
- DB,
- notification logic.

### ML Engineer
- forecasting,
- feature engineering,
- evaluation.

### Optimization Engineer
- OR-Tools,
- transfer logic,
- constraints.

### Frontend Engineer
- dashboard,
- components,
- responsiveness.

### QA / Demo Support
- test cases,
- bug tracking,
- presentation support.

---

## 18. Risks by Stage

### Early stage risks
- Scope creep.
- Overbuilding models.
- Unclear data format.

### Mid-stage risks
- Optimization logic too complex.
- UI clutter.
- Forecast integration issues.

### Late-stage risks
- Demo instability.
- Poor storytelling.
- Missing explanation text.

### Mitigation
- Freeze scope early.
- Use the simplest model that works.
- Keep the first version small and stable.

---

## 19. Recommended MVP Timeline

If building in a hackathon style:
- **Day 1:** data + backend + baseline forecast.
- **Day 2:** optimization + dashboard.
- **Day 3:** alerts + explanations + demo.

If building in a more relaxed product sprint:
- **Week 1:** foundation.
- **Week 2:** ML and optimization.
- **Week 3:** UI and alerts.
- **Week 4:** testing and presentation.

---

## 20. Final Roadmap Principle

The fastest path to a strong product is:
**prove data → prove forecast → prove recommendation → prove usability.**

That sequence creates a product that is both technically solid and easy to explain.
