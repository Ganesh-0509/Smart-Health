# AI-ML-Blueprint.md
# AI and Machine Learning Blueprint

## 1. Blueprint Purpose

This document defines the AI/ML strategy for the PHC Inventory Optimization System.  
It explains what models to use, what data to train on, how to evaluate them, and how the AI layer connects to the optimization engine.

The core design philosophy is **predict then optimize**: first forecast demand, then compute the best redistribution plan. Recent healthcare and perishable-supply research supports this kind of pipeline because forecasting and inventory optimization work best when combined into one decision loop.[web:68][web:38][web:70]

---

## 2. AI Problem to Solve

The system must answer:
- How much of each medicine will each PHC need soon?
- Where will shortage happen first?
- Which stock should be moved before expiry?
- How should limited supply be allocated across PHCs?

This is a structured forecasting and optimization problem, not a generative AI problem.

---

## 3. AI Design Principles

1. Use the simplest model that performs well.
2. Prefer tabular and seasonal models over unnecessary deep learning for sparse data.
3. Keep results explainable.
4. Use a forecast evaluation benchmark.
5. Feed model outputs into optimization.
6. Human approval remains part of the workflow.

---

## 4. Data Strategy

## 4.1 Required data
- Date-wise stock snapshot.
- Date-wise item usage.
- PHC identity.
- Medicine identity.
- Batch expiry.
- PHC location.
- Calendar flags.
- Weather data if available.

## 4.2 Optional enrichments
- Holiday/festival flags.
- Disease seasonality.
- PHC population coverage.
- Transport distance.
- Historical transfer records.
- Demand shocks.

## 4.3 Data granularity
Best granularity for MVP:
- daily data,
- item-level,
- PHC-level.

This gives enough detail to forecast demand and identify redistribution opportunities.

---

## 5. Modeling Strategy

## 5.1 Baseline models
Always include a simple baseline:
- moving average,
- seasonal moving average,
- exponential smoothing.

These are important because any advanced model must outperform a simple benchmark.

## 5.2 Strong tabular models
Best first-choice models:
- **LightGBM**
- **XGBoost**

Why:
- work well on structured tabular data,
- handle non-linear relationships,
- support lag features and external variables,
- perform well even when the dataset is not huge.

## 5.3 Seasonal benchmark
Use **Prophet** as a benchmark if the item demand has seasonality and holiday effects.

## 5.4 Advanced models
Use only if the dataset grows large:
- LSTM.
- Temporal convolution networks.
- Sequence transformers.

For this project, deep learning should be optional, not the core MVP model, because the data volume in PHCs is likely limited and inconsistent.

---

## 6. Forecasting Framework

## 6.1 Forecast objective
Predict future item demand per PHC for:
- next day,
- next 7 days,
- next 14 days.

## 6.2 Target
`predicted_demand[phc_id, medicine_id, horizon]`

## 6.3 Feature set
### Time features
- day of week,
- month,
- quarter,
- holiday,
- festival,
- season.

### Lag features
- usage t-1,
- usage t-7,
- usage t-14,
- usage t-30.

### Rolling features
- rolling mean,
- rolling standard deviation,
- rolling min,
- rolling max,
- rolling trend slope.

### Supply features
- current stock,
- days to expiry,
- safety stock gap.

### Context features
- rainfall,
- temperature,
- PHC population,
- transport distance.

---

## 7. Model Training Pipeline

## 7.1 Preprocessing
- Clean missing values.
- Standardize medicine names.
- Normalize units.
- Remove duplicate rows.
- Clip invalid stock values.
- Ensure chronological ordering.

## 7.2 Train-test split
Use time-based split only.
Do not use random split because it leaks future information.

## 7.3 Training procedure
1. Build baseline forecasts.
2. Train LightGBM/XGBoost.
3. Compare against Prophet.
4. Select best model per item group or per PHC cluster.
5. Store the model version and metrics.

## 7.4 Retraining
- MVP: manual retraining.
- Later: scheduled retraining monthly or weekly.

---

## 8. Evaluation Plan

## 8.1 Forecasting metrics
Use:
- **MAE** for average absolute error.
- **RMSE** for large error sensitivity.
- **MAPE** for percentage error.
- **WAPE** for business-facing inventory accuracy.
- **Bias** to detect over-forecasting or under-forecasting.

Recent forecasting guidance emphasizes using metrics like MAE, RMSE, and MAPE together, while WAPE is often more useful when practical inventory impact matters.[web:66][web:69][web:71]

## 8.2 Optimization metrics
- shortage reduction,
- expiry reduction,
- transport cost reduction,
- service level,
- transfer acceptance rate.

## 8.3 Benchmarking
Every advanced model must be compared against:
- naive forecast,
- moving average,
- seasonal baseline.

---

## 9. Explainability Strategy

The system must explain:
- why a shortage risk was detected,
- why a transfer is suggested,
- why one PHC is the donor,
- why the item is prioritized.

## Explainability methods
- Feature importance for tree models.
- SHAP for local explanation.
- Rule-based human-readable summary.

Example explanation:
> “Demand is expected to rise because the last 7-day usage trend is increasing, rainfall has increased, and the item is near its replenishment threshold.”

---

## 10. Optimization Blueprint

## 10.1 Objective
Minimize:
- projected shortage,
- expiry waste,
- transport cost.

## 10.2 Variables
- transfer quantity from PHC A to PHC B,
- item selection,
- timing of transfer.

## 10.3 Constraints
- source safety stock,
- receiver capacity,
- item availability,
- expiry feasibility,
- transport capacity.

## 10.4 Solver
Use **OR-Tools** for the optimization layer.

Why:
- robust constraint handling,
- linear and integer optimization support,
- good fit for allocation and transfer planning.[web:53]

---

## 11. Suggested Model Hierarchy

## Level 1: MVP
- Moving average baseline.
- LightGBM demand forecast.
- OR-Tools optimization.
- Rule-based explanations.

## Level 2: Better version
- LightGBM + Prophet ensemble.
- SHAP explanations.
- Smarter transfer prioritization.

## Level 3: Advanced version
- Multi-horizon forecasting.
- Hierarchical forecasting by PHC cluster.
- Scenario simulation.
- Robust optimization.

---

## 12. Dataset Design

## 12.1 Training dataset format
Each row should represent one item at one PHC on one date.

Example:
- `date`
- `phc_id`
- `medicine_id`
- `usage_qty`
- `stock_qty`
- `days_to_expiry`
- `holiday_flag`
- `rainfall`
- `temperature`
- `forecast_target`

## 12.2 Labels
- demand for next day,
- demand for next 7 days,
- demand for next 14 days.

## 12.3 Data quality rules
- no future leakage,
- no negative stock,
- expiry dates must be valid,
- missing data should be imputed carefully.

---

## 13. Model Selection Logic

Use this logic:
- If data is sparse: moving average or Prophet.
- If data is moderate and tabular: LightGBM/XGBoost.
- If data is large and sequential: ensemble or deep learning.
- If strong seasonality exists: include Prophet.
- If model must be interpretable: prefer tree-based methods.

---

## 14. Output Format

The AI layer should output:

### Forecast output
- predicted demand,
- confidence range,
- risk score.

### Recommendation output
- donor PHC,
- target PHC,
- item,
- quantity,
- reason,
- urgency level.

### Alert output
- shortage warning,
- expiry warning,
- action required.

---

## 15. Feedback Loop

After each recommendation:
- compare forecast vs actual usage,
- compare suggested transfer vs actual transfer,
- measure whether shortage was prevented,
- update training data.

This closed loop improves future forecasts and makes the system smarter over time.

---

## 16. Recommended Final AI Stack

For this project, the best stack is:
- **Forecasting:** LightGBM + Prophet benchmark.
- **Explainability:** SHAP.
- **Optimization:** OR-Tools.
- **Validation:** time-based backtesting.
- **Metrics:** MAE, RMSE, MAPE, WAPE, Bias.

This combination is strong because it balances performance, interpretability, and practicality in healthcare inventory forecasting.[web:57][web:61][web:64][web:66][web:68]

---

## 17. Final AI Recommendation

Do not overcomplicate the first version with deep learning unless you have large and clean data.  
For PHC inventory optimization, the best-grade practical solution is:

**Tabular forecasting + seasonal benchmark + explainable tree models + constrained optimization.**

That gives the best balance of accuracy, interpretability, and deployability.
