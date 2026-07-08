# Technical-Specification.md
# Technical Specification

## 1. Purpose

This document explains **how to implement** the PHC Inventory Optimization System in technical detail.  
It defines the stack, module behavior, data structures, API contracts, algorithm choices, model strategy, and deployment plan.

The implementation strategy should follow a hybrid design: **forecast demand first, then optimize transfers second**. This is the most practical pattern for healthcare inventory systems because forecasting and allocation solve different parts of the problem.[web:57][web:61][web:64]

---

## 2. System Constraints

- Low-resource healthcare setting.
- Limited real-time infrastructure.
- Likely sparse or imperfect data.
- Need for explainable outputs.
- Minimal training burden for users.
- MVP must work with synthetic or CSV-based data.

---

## 3. Recommended Tech Stack

## 3.1 Frontend
- **Next.js** for fast dashboard development.
- **React** for component structure.
- **Tailwind CSS** for clean healthcare UI.
- **Chart.js** for demand and stock charts.
- **Leaflet** for mapping PHCs.

## 3.2 Backend
- **FastAPI** for API services.
- **Python** for ML and optimization integration.
- **Pydantic** for request validation.
- **SQLAlchemy** or direct DB access for persistence.

## 3.3 Database
- **PostgreSQL** for relational inventory, PHC, and transfer data.

## 3.4 ML / Optimization
- **XGBoost** or **LightGBM** for tabular forecasting.
- **Prophet** as a seasonal benchmark.
- **Moving average / exponential smoothing** as baseline.
- **OR-Tools** for optimization.

## 3.5 Deployment
- **Docker** for containerization.
- **Cloud Run** or equivalent serverless container hosting.
- **Firebase / SMTP / SMS gateway** for alerts.

---

## 4. Implementation Philosophy

For this product, the implementation should avoid overcomplicated deep learning in the first version unless the dataset is very large.  
Recent healthcare demand forecasting work shows that ML and ensemble methods often outperform traditional baselines, but the strongest practical choice for a small/medium tabular dataset is usually gradient-boosting plus good features, not a heavy neural model.[web:61][web:64]

For MVP:
- Use tabular models first.
- Add seasonal forecasting as benchmark.
- Use optimization logic separately.
- Keep outputs explainable.

---

## 5. Core Data Entities

## 5.1 PHC
Fields:
- `phc_id`
- `phc_name`
- `block_name`
- `district_name`
- `latitude`
- `longitude`
- `catchment_population`
- `priority_level`

## 5.2 Medicine
Fields:
- `medicine_id`
- `medicine_name`
- `unit_type`
- `min_safety_stock`
- `category`
- `critical_flag`

## 5.3 Inventory Snapshot
Fields:
- `snapshot_id`
- `phc_id`
- `medicine_id`
- `stock_qty`
- `batch_no`
- `expiry_date`
- `snapshot_date`

## 5.4 Usage Record
Fields:
- `usage_id`
- `phc_id`
- `medicine_id`
- `used_qty`
- `usage_date`
- `reason_group`

## 5.5 Forecast Record
Fields:
- `forecast_id`
- `phc_id`
- `medicine_id`
- `forecast_date`
- `horizon_days`
- `predicted_demand`
- `prediction_lower`
- `prediction_upper`
- `model_version`

## 5.6 Recommendation
Fields:
- `recommendation_id`
- `source_phc_id`
- `target_phc_id`
- `medicine_id`
- `suggested_qty`
- `priority_score`
- `reason_text`
- `status`

## 5.7 Transfer Action
Fields:
- `transfer_id`
- `recommendation_id`
- `initiated_by`
- `approved_by`
- `shipped_at`
- `received_at`
- `actual_qty`
- `status`

---

## 6. API Design

## 6.1 Ingestion APIs
- `POST /api/inventory/upload`
- `POST /api/usage/upload`
- `POST /api/phc/upload`

## 6.2 Forecast APIs
- `GET /api/forecast/{phc_id}/{medicine_id}`
- `GET /api/forecast/block/{block_id}`

## 6.3 Recommendation APIs
- `GET /api/recommendations`
- `POST /api/recommendations/{id}/approve`
- `POST /api/recommendations/{id}/reject`

## 6.4 Dashboard APIs
- `GET /api/dashboard/summary`
- `GET /api/dashboard/phc/{phc_id}`

## 6.5 Reporting APIs
- `GET /api/reports/stockout-risk`
- `GET /api/reports/expiry-risk`
- `GET /api/reports/waste-avoided`

---

## 7. Forecasting Design

## 7.1 Best-fit model strategy
The forecasting layer should be a **model comparison pipeline**:
1. Baseline moving average.
2. Prophet.
3. LightGBM or XGBoost.
4. Optional ensemble of the top two models.

This is a strong approach because demand forecasting problems in healthcare often have seasonality, noisy usage patterns, and limited data, making tree-based models and seasonal models useful complements.[web:57][web:61][web:64]

## 7.2 Feature set
Use:
- lag 1, lag 7, lag 14, lag 30 usage values,
- rolling mean,
- rolling std,
- day of week,
- month,
- holiday flag,
- rainfall,
- temperature,
- expiry pressure,
- stock level,
- recent demand slope.

## 7.3 Output
For each medicine and PHC:
- next-day demand,
- 7-day demand,
- 14-day demand,
- confidence interval,
- feature contribution summary.

## 7.4 Forecast evaluation
- MAE
- RMSE
- MAPE
- WAPE
- Backtest by time split

---

## 8. Optimization Design

## 8.1 Optimization problem
The system must choose transfers that minimize shortage, expiry waste, and transport cost.

## 8.2 Objective function
Minimize:
- shortage penalty,
- expiry penalty,
- transport cost,
- unnecessary transfer cost.

## 8.3 Constraints
- Source PHC cannot go below safety stock.
- Target PHC should not receive more than its forecasted need.
- Transfer quantity must be integer.
- Route or distance may limit donor selection.
- Expiry batch priority must be respected.

## 8.4 Solver choice
Use **OR-Tools** or linear programming because it supports:
- integer decisions,
- allocation,
- flow-style constraints,
- scalable optimization for redistribution problems.[web:53]

## 8.5 Transfer logic
Priority order:
1. Critical shortage.
2. Near-expiry surplus.
3. Lowest transport cost.
4. Highest donation feasibility.

---

## 9. Routing / Distance Logic

## 9.1 Use case
When recommending transfers, the system should consider geographic distance.

## 9.2 Approach
- Store PHC latitude/longitude.
- Compute distance matrix.
- Use route/time cost if available.
- For MVP, use Haversine distance.
- For later versions, use Maps API.

## 9.3 Output
- donor PHC,
- receiver PHC,
- suggested route distance,
- estimated transfer time.

---

## 10. Alerting Logic

Alerts should trigger when:
- forecasted demand exceeds stock,
- stock is near expiry,
- demand spike is detected,
- transfer recommendation is waiting approval,
- transfer is overdue.

Alert channels:
- dashboard banners,
- email,
- SMS,
- optional push notifications.

---

## 11. Explainability Design

Each recommendation must include:
- recommendation text,
- reason summary,
- top contributing factors,
- predicted vs current stock gap,
- expected benefit.

Example:
> “Transfer 80 ORS packets from PHC A to PHC B because PHC B is projected to run out in 4 days, while PHC A has surplus stock expiring soon.”

This is important because healthcare users need actionable reasons, not only model output.

---

## 12. Model Training Pipeline

## 12.1 Data preparation
- clean missing values,
- normalize medicine names,
- create time features,
- compute lags and rolling statistics,
- encode categorical features.

## 12.2 Training process
- split by time,
- train baseline,
- train LightGBM/XGBoost,
- tune hyperparameters,
- compare metrics,
- select best model per item group.

## 12.3 Versioning
- store model version,
- store training date,
- store feature schema,
- store performance metrics.

## 12.4 Retraining
- weekly or monthly retraining if enough data,
- immediate retraining not required for MVP.

---

## 13. Dataset Specification

## 13.1 Required fields
- PHC ID
- Medicine ID
- Date
- Stock quantity
- Used quantity
- Expiry date
- Location
- Holiday/season flags

## 13.2 Optional fields
- weather,
- disease category,
- catchment population,
- patient count proxy,
- transport availability.

## 13.3 Data format
Use CSV for MVP.  
Recommended files:
- `phc_master.csv`
- `medicine_master.csv`
- `inventory_snapshot.csv`
- `usage_history.csv`
- `weather.csv`
- `calendar.csv`

---

## 14. Backend Logic

## 14.1 Daily job
A scheduled daily job should:
1. load new data,
2. generate forecasts,
3. run optimization,
4. store recommendations,
5. send alerts.

## 14.2 On-demand job
When a manager updates stock manually, recalculate recommendations.

## 14.3 Approval workflow
- recommendation generated,
- user approves/rejects,
- transfer record updated,
- logs preserved.

---

## 15. Security and Access Control

Roles:
- PHC pharmacist.
- PHC doctor.
- Block manager.
- District officer.
- Admin.

Rules:
- users only access allowed PHCs,
- admin can view all,
- write actions require authentication,
- all changes should be logged.

---

## 16. Non-Functional Requirements

- Fast daily processing.
- Reliable database storage.
- Clear error messages.
- Mobile-friendly dashboard.
- Auditability.
- Low connectivity tolerance.
- Easy rollback for failed updates.

---

## 17. Testing Strategy

## 17.1 Unit tests
- data validation,
- forecast functions,
- optimization constraints,
- alert generation.

## 17.2 Integration tests
- upload to database,
- forecast to recommendation flow,
- approval updates.

## 17.3 Scenario tests
- stockout scenario,
- expiry-heavy scenario,
- donor shortage scenario,
- multi-PHC conflict scenario.

---

## 18. MVP Build Priority

Recommended build order:
1. Database schema.
2. CSV ingestion.
3. Forecast baseline.
4. Optimization engine.
5. Alerts.
6. Dashboard.
7. Explainability layer.
8. Reports.

---

## 19. Technology Risks and Mitigation

### Risk: Sparse data
Mitigation:
- use synthetic data,
- use baseline models,
- backtest carefully.

### Risk: Overfitting
Mitigation:
- use time-based validation,
- compare to simple baseline.

### Risk: Bad optimization recommendations
Mitigation:
- impose safety stock constraints,
- keep human approval in the loop.

### Risk: User confusion
Mitigation:
- plain-language explanations,
- minimal UI complexity.

---

## 20. Final Technical Recommendation

For the strongest implementation:
- **Forecasting:** LightGBM/XGBoost + Prophet benchmark.
- **Optimization:** OR-Tools.
- **DB:** PostgreSQL.
- **Backend:** FastAPI.
- **Frontend:** Next.js.
- **Charts:** Chart.js.
- **Maps:** Leaflet or distance matrix.
- **Alerts:** SMS/email + dashboard.

This combination gives a strong balance of quality, practicality, and hackathon feasibility.[web:53][web:57][web:61][web:64]
