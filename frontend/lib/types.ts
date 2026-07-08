// Types mirror the Smart Health API Contract (v1) exactly.

export type PhcType = "PHC" | "CHC";
export type RiskLevel = "healthy" | "warning" | "critical";
export type Urgency = "low" | "medium" | "high" | "critical";
export type RecommendationStatus =
  | "awaiting_verification"
  | "awaiting_approval"
  | "approved"
  | "assigned"
  | "picked_up"
  | "stock_updated"
  | "rejected";
// A convenience filter value the API accepts to mean "all in-flight".
export type RecommendationStatusFilter = RecommendationStatus | "open";
export type TransferType = "redistribution" | "return_to_store";
export type LogisticsModel =
  | "piggyback"
  | "hub_and_spoke"
  | "emergency_lateral"
  | "return_to_store";
export type EscalationLevel =
  | "none"
  | "supervisor"
  | "district_officer"
  | "emergency";
export type Confidence = "high" | "medium" | "low" | "very_low";
export type DigitalMaturity = "app" | "smartphone" | "sms";
export type ReceivedCondition = "good" | "damaged" | "partial";
export type DoctorStatus = "present" | "absent" | "on_leave";
export type Role =
  | "pharmacist"
  | "medical_officer"
  | "block_manager"
  | "district_officer"
  | "admin";

export type AlertType =
  | "shortage"
  | "expiry"
  | "spike"
  | "transfer_due"
  | "bed_full"
  | "doctor_absent"
  | "test_down";

export type Lang = "en" | "hi";

export interface Phc {
  phc_id: string;
  name: string;
  type: PhcType;
  block: string;
  district: string;
  latitude: number;
  longitude: number;
  catchment_population: number;
  priority_level: number;
}

export interface Medicine {
  medicine_id: string;
  name: string;
  unit: string;
  category: string;
  critical: boolean;
  min_safety_stock: number;
}

export interface DashboardKpis {
  items_at_shortage_risk: number;
  items_near_expiry: number;
  pending_recommendations: number;
  beds_available: number;
  beds_total: number;
  doctors_present: number;
  doctors_expected: number;
  footfall_today: number;
  tests_unavailable: number;
  active_alerts: number;
}

export interface StockHealth {
  healthy: number;
  warning: number;
  critical: number;
}

export interface DemandTrendPoint {
  date: string;
  predicted: number;
  actual: number | null;
}

export interface TopAlert {
  id: string;
  type: AlertType;
  risk_level: RiskLevel;
  phc_id: string;
  title_en: string;
  title_hi: string;
  message_en: string;
  message_hi: string;
}

export interface DashboardSummary {
  scope: "district" | "phc";
  phc_id: string | null;
  kpis: DashboardKpis;
  stock_health: StockHealth;
  demand_trend: DemandTrendPoint[];
  top_alerts: TopAlert[];
}

export interface InventoryItem {
  phc_id: string;
  phc_name: string;
  medicine_id: string;
  medicine_name: string;
  stock_qty: number;
  min_safety_stock: number;
  batch_no: string;
  expiry_date: string;
  days_to_expiry: number;
  snapshot_date: string;
  avg_daily_usage: number;
  days_of_cover: number;
  risk_level: RiskLevel;
  near_expiry: boolean;
  reason_en?: string;
  reason_hi?: string;
  // How/when the stock figure was captured, and how much to trust it.
  updated_via?: string;
  data_confidence?: Confidence;
  confidence_reason_en?: string;
  confidence_reason_hi?: string;
}

export interface ForecastHistoryPoint {
  date: string;
  usage: number;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface Forecast {
  phc_id: string;
  medicine_id: string;
  horizon_days: number;
  model: string;
  model_version: string;
  history: ForecastHistoryPoint[];
  forecast: ForecastPoint[];
  risk_score: number;
  explain: {
    top_factors_en: string[];
    top_factors_hi: string[];
  };
}

export interface ForecastMetricSet {
  MAE: number;
  RMSE: number;
  MAPE: number;
  WAPE: number;
  bias: number;
}

export interface ForecastMetrics {
  model: string;
  baseline: string;
  metrics: ForecastMetricSet;
  baseline_metrics: ForecastMetricSet;
  improvement_pct: number;
}

export interface Recommendation {
  recommendation_id: string;
  transfer_type: TransferType;
  source_phc_id: string;
  source_phc_name: string;
  target_phc_id: string;
  target_phc_name: string;
  medicine_id: string;
  medicine_name: string;
  unit: string;
  suggested_qty: number;
  urgency: Urgency;
  priority_score: number;
  distance_km: number;
  // Clinical / logistics context
  batch_no: string;
  expiry_date: string;
  cold_chain: boolean;
  storage_condition: string;
  predicted_stockout_date: string | null;
  source_buffer_days_after: number;
  logistics_model: LogisticsModel;
  emergency: boolean;
  escalation_level: EscalationLevel;
  confidence: Confidence;
  confidence_reason_en: string;
  confidence_reason_hi: string;
  expected_benefit_en: string;
  expected_benefit_hi: string;
  reason_en: string;
  reason_hi: string;
  status: RecommendationStatus;
  // Lifecycle audit fields (null until the relevant step happens)
  verified_by: string | null;
  verified_at: string | null;
  verified_qty: number | null;
  approved_by: string | null;
  approved_at: string | null;
  actual_qty: number | null;
  assigned_at: string | null;
  pickup_by: string | null;
  picked_up_at: string | null;
  received_qty: number | null;
  received_condition: ReceivedCondition | null;
  delivered_at: string | null;
  stock_updated_at: string | null;
  reject_reason: string | null;
  modify_reason: string | null;
  created_at: string;
}

export interface TimelineEvent {
  event: string;
  actor: string;
  note: string;
  at: string;
}

export interface SmsIngestResult {
  ok: boolean;
  phc_id: string;
  medicine_id: string;
  medicine_name: string;
  stock_qty: number;
  batch_no: string;
  expiry_date: string;
  updated_via: string;
  data_confidence: Confidence;
  note_en: string;
  note_hi: string;
}

export interface CsvIngestResult {
  ok: boolean;
  inserted: number;
  errors: string[];
  updated_via: string;
  data_confidence: Confidence;
}

export interface Alert {
  id: string;
  type: AlertType;
  risk_level: RiskLevel;
  phc_id: string;
  phc_name: string;
  title_en: string;
  title_hi: string;
  message_en: string;
  message_hi: string;
  created_at: string;
}

export interface ReportSummary {
  waste_avoided_units: number;
  waste_avoided_value: number;
  stockouts_prevented: number;
  transfer_completion_rate: number;
  recommendation_acceptance_rate: number;
  top_risky_medicines: { medicine_id: string; name: string; risk_score: number }[];
  top_risky_phcs: { phc_id: string; name: string; health_score: number }[];
  trend: { week: string; stockouts: number; waste: number }[];
}

export interface BedSection {
  total: number;
  occupied: number;
}

export interface BedRecord {
  phc_id: string;
  phc_name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  general: BedSection;
  icu: BedSection;
  maternity: BedSection;
  occupancy_rate: number;
  status: RiskLevel;
  updated_at: string;
}

export interface FootfallSeriesPoint {
  date: string;
  opd: number;
  total: number;
}

export interface FootfallByPhc {
  phc_id: string;
  phc_name: string;
  total: number;
}

export interface Footfall {
  phc_id: string | null;
  today: { opd: number; ipd: number; emergency: number; total: number };
  series: FootfallSeriesPoint[];
  avg_daily: number;
  peak_hour: string;
  by_phc?: FootfallByPhc[];
}

export interface Doctor {
  phc_id: string;
  phc_name: string;
  doctor_name: string;
  specialty: string;
  status: DoctorStatus;
  expected: boolean;
  since: string;
}

export interface DoctorSummary {
  present: number;
  absent: number;
  on_leave: number;
  expected: number;
  attendance_rate: number;
}

export interface TestRecord {
  phc_id: string;
  phc_name: string;
  test_name: string;
  category: string;
  available: boolean;
  reason_en?: string;
  reason_hi?: string;
  updated_at: string;
}

export interface PhcScore {
  phc_id: string;
  name: string;
  type: PhcType;
  latitude: number;
  longitude: number;
  health_score: number;
  risk_level: RiskLevel;
  stock_risk: number;
  bed_pressure: number;
  doctor_gap: number;
  test_gap: number;
  flagged: boolean;
  flag_reason_en: string;
  flag_reason_hi: string;
}

export interface DistrictOverview {
  district: string;
  phc_scores: PhcScore[];
  flagged_count: number;
  district_kpis: {
    avg_health_score: number;
    total_phcs: number;
    critical_phcs: number;
  };
}

// ---- AI assistant (Gemini) -------------------------------------------------

export type AiSource = "gemini" | "fallback";

export interface AssistantStatus {
  gemini_enabled: boolean;
  model: string;
  mode: "live" | "fallback";
  note_en: string;
  note_hi: string;
}

export interface AssistantGrounding {
  flagged_centres: number;
  critical_items: number;
  open_transfers: number;
}

export interface AssistantAnswer {
  question: string;
  answer_en: string;
  answer_hi: string;
  source: AiSource;
  grounding: AssistantGrounding;
}

export interface RecommendationBriefing {
  recommendation_id: string;
  briefing_en: string;
  briefing_hi: string;
  source: AiSource;
}
