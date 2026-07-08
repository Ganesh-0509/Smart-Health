import type {
  Alert,
  AssistantAnswer,
  AssistantStatus,
  BedRecord,
  CsvIngestResult,
  DashboardSummary,
  DistrictOverview,
  Doctor,
  DoctorSummary,
  Footfall,
  Forecast,
  ForecastMetrics,
  InventoryItem,
  Lang,
  Medicine,
  Phc,
  Recommendation,
  RecommendationBriefing,
  ReportSummary,
  SmsIngestResult,
  TestRecord,
  TimelineEvent,
} from "./types";

// ---- Master data -----------------------------------------------------------

export const mockPhcs: Phc[] = [
  { phc_id: "PHC-01", name: "Rampur PHC", type: "PHC", block: "Rampur", district: "Bareilly", latitude: 28.81, longitude: 79.02, catchment_population: 32000, priority_level: 2 },
  { phc_id: "PHC-02", name: "Kila PHC", type: "PHC", block: "Kila", district: "Bareilly", latitude: 28.36, longitude: 79.41, catchment_population: 28500, priority_level: 3 },
  { phc_id: "PHC-03", name: "Sadar CHC", type: "CHC", block: "Sadar", district: "Bareilly", latitude: 28.85, longitude: 79.10, catchment_population: 61000, priority_level: 1 },
  { phc_id: "PHC-04", name: "Bhojipura PHC", type: "PHC", block: "Bhojipura", district: "Bareilly", latitude: 28.53, longitude: 79.55, catchment_population: 24000, priority_level: 2 },
  { phc_id: "PHC-05", name: "Nawabganj CHC", type: "CHC", block: "Nawabganj", district: "Bareilly", latitude: 28.53, longitude: 79.63, catchment_population: 54000, priority_level: 1 },
  { phc_id: "PHC-06", name: "Faridpur PHC", type: "PHC", block: "Faridpur", district: "Bareilly", latitude: 28.21, longitude: 79.53, catchment_population: 30500, priority_level: 2 },
  { phc_id: "PHC-07", name: "Mirganj PHC", type: "PHC", block: "Mirganj", district: "Bareilly", latitude: 28.42, longitude: 79.32, catchment_population: 26000, priority_level: 3 },
  { phc_id: "PHC-08", name: "Aonla CHC", type: "CHC", block: "Aonla", district: "Bareilly", latitude: 28.27, longitude: 79.16, catchment_population: 49000, priority_level: 1 },
];

export const mockMedicines: Medicine[] = [
  { medicine_id: "MED-01", name: "ORS Sachet", unit: "sachet", category: "Oral Rehydration", critical: true, min_safety_stock: 200 },
  { medicine_id: "MED-02", name: "Paracetamol 500mg", unit: "tablet", category: "Analgesic", critical: true, min_safety_stock: 500 },
  { medicine_id: "MED-03", name: "Amoxicillin 250mg", unit: "capsule", category: "Antibiotic", critical: true, min_safety_stock: 300 },
  { medicine_id: "MED-04", name: "Iron Folic Acid", unit: "tablet", category: "Supplement", critical: false, min_safety_stock: 400 },
  { medicine_id: "MED-05", name: "Metformin 500mg", unit: "tablet", category: "Antidiabetic", critical: false, min_safety_stock: 250 },
  { medicine_id: "MED-06", name: "ORS + Zinc Kit", unit: "kit", category: "Oral Rehydration", critical: true, min_safety_stock: 150 },
  { medicine_id: "MED-07", name: "Anti-Snake Venom", unit: "vial", category: "Emergency", critical: true, min_safety_stock: 20 },
  { medicine_id: "MED-08", name: "Oxytocin Injection", unit: "ampoule", category: "Maternal", critical: true, min_safety_stock: 80 },
];

// ---- Helpers ---------------------------------------------------------------

function daysAgoISO(n: number): string {
  const d = new Date("2026-07-08T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
function daysFromISO(n: number): string {
  const d = new Date("2026-07-08T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- Dashboard -------------------------------------------------------------

const demandTrend = Array.from({ length: 14 }).map((_, i) => {
  const base = 165 + Math.round(Math.sin(i / 2) * 22) + i * 2;
  const isFuture = i > 9;
  return {
    date: daysAgoISO(13 - i),
    predicted: base,
    actual: isFuture ? null : base - Math.round(Math.cos(i) * 8),
  };
});

export const mockDashboard: DashboardSummary = {
  scope: "district",
  phc_id: null,
  kpis: {
    items_at_shortage_risk: 7,
    items_near_expiry: 4,
    pending_recommendations: 5,
    beds_available: 42,
    beds_total: 70,
    doctors_present: 11,
    doctors_expected: 15,
    footfall_today: 620,
    tests_unavailable: 3,
    active_alerts: 9,
  },
  stock_health: { healthy: 120, warning: 22, critical: 9 },
  demand_trend: demandTrend,
  top_alerts: [
    { id: "AL-1", type: "shortage", risk_level: "critical", phc_id: "PHC-03", title_en: "ORS shortage in 3 days", title_hi: "ORS 3 दिनों में समाप्त", message_en: "Sadar CHC projected to run out of ORS Sachet in 3 days.", message_hi: "सदर सीएचसी में ORS सैशे 3 दिनों में समाप्त होने का अनुमान।" },
    { id: "AL-2", type: "expiry", risk_level: "warning", phc_id: "PHC-02", title_en: "Amoxicillin nearing expiry", title_hi: "एमोक्सिसिलिन समाप्ति के करीब", message_en: "Batch B7781 expires in 21 days at Kila PHC.", message_hi: "किला पीएचसी में बैच B7781 21 दिनों में समाप्त।" },
    { id: "AL-3", type: "bed_full", risk_level: "critical", phc_id: "PHC-05", title_en: "ICU beds full", title_hi: "आईसीयू बेड भरे", message_en: "Nawabganj CHC ICU at 100% occupancy.", message_hi: "नवाबगंज सीएचसी आईसीयू 100% अधिभोग पर।" },
    { id: "AL-4", type: "test_down", risk_level: "warning", phc_id: "PHC-01", title_en: "Malaria RDT unavailable", title_hi: "मलेरिया RDT अनुपलब्ध", message_en: "Kit stock exhausted at Rampur PHC.", message_hi: "रामपुर पीएचसी में किट स्टॉक समाप्त।" },
  ],
};

// ---- Inventory -------------------------------------------------------------

export const mockInventory: InventoryItem[] = [
  { phc_id: "PHC-03", phc_name: "Sadar CHC", medicine_id: "MED-01", medicine_name: "ORS Sachet", stock_qty: 90, min_safety_stock: 200, batch_no: "B2451", expiry_date: daysFromISO(69), days_to_expiry: 69, snapshot_date: "2026-07-08", avg_daily_usage: 34.2, days_of_cover: 2.6, risk_level: "critical", near_expiry: false, reason_en: "Only 2.6 days of cover — below safety stock", reason_hi: "केवल 2.6 दिन कवर — सुरक्षा स्टॉक से नीचे", updated_via: "barcode", data_confidence: "high", confidence_reason_en: "Updated today via barcode/system sync.", confidence_reason_hi: "आज बारकोड/सिस्टम सिंक से अपडेट किया गया।" },
  { phc_id: "PHC-05", phc_name: "Nawabganj CHC", medicine_id: "MED-08", medicine_name: "Oxytocin Injection", stock_qty: 24, min_safety_stock: 80, batch_no: "B9012", expiry_date: daysFromISO(40), days_to_expiry: 40, snapshot_date: "2026-07-08", avg_daily_usage: 7.5, days_of_cover: 3.2, risk_level: "critical", near_expiry: false, reason_en: "3.2 days of cover for a critical maternal drug", reason_hi: "गंभीर मातृ दवा के लिए 3.2 दिन कवर", updated_via: "sms", data_confidence: "low", confidence_reason_en: "Recorded via SMS — physical verification advised.", confidence_reason_hi: "एसएमएस से दर्ज — भौतिक सत्यापन सलाह दी जाती है।" },
  { phc_id: "PHC-02", phc_name: "Kila PHC", medicine_id: "MED-03", medicine_name: "Amoxicillin 250mg", stock_qty: 520, min_safety_stock: 300, batch_no: "B7781", expiry_date: daysFromISO(21), days_to_expiry: 21, snapshot_date: "2026-07-08", avg_daily_usage: 18.0, days_of_cover: 28.9, risk_level: "warning", near_expiry: true, reason_en: "Batch expires in 21 days — risk of waste", reason_hi: "बैच 21 दिनों में समाप्त — बर्बादी जोखिम", updated_via: "app", data_confidence: "medium", confidence_reason_en: "Entered via smartphone app 2 days ago.", confidence_reason_hi: "2 दिन पहले स्मार्टफोन ऐप से दर्ज किया गया।" },
  { phc_id: "PHC-01", phc_name: "Rampur PHC", medicine_id: "MED-01", medicine_name: "ORS Sachet", stock_qty: 150, min_safety_stock: 200, batch_no: "B2455", expiry_date: daysFromISO(80), days_to_expiry: 80, snapshot_date: "2026-07-08", avg_daily_usage: 30.0, days_of_cover: 5.0, risk_level: "warning", near_expiry: false, reason_en: "5 days of cover — approaching safety level", reason_hi: "5 दिन कवर — सुरक्षा स्तर के करीब", updated_via: "barcode", data_confidence: "high", confidence_reason_en: "Updated today via barcode/system sync.", confidence_reason_hi: "आज बारकोड/सिस्टम सिंक से अपडेट किया गया।" },
  { phc_id: "PHC-08", phc_name: "Aonla CHC", medicine_id: "MED-07", medicine_name: "Anti-Snake Venom", stock_qty: 6, min_safety_stock: 20, batch_no: "B3320", expiry_date: daysFromISO(120), days_to_expiry: 120, snapshot_date: "2026-07-01", avg_daily_usage: 1.2, days_of_cover: 5.0, risk_level: "critical", near_expiry: false, reason_en: "Emergency stock critically low (6 vials)", reason_hi: "आपातकालीन स्टॉक बेहद कम (6 वायल)", updated_via: "manual", data_confidence: "very_low", confidence_reason_en: "Manual register entry 7 days old — verify before acting.", confidence_reason_hi: "मैनुअल रजिस्टर प्रविष्टि 7 दिन पुरानी — कार्रवाई से पहले सत्यापित करें।" },
  { phc_id: "PHC-04", phc_name: "Bhojipura PHC", medicine_id: "MED-02", medicine_name: "Paracetamol 500mg", stock_qty: 1800, min_safety_stock: 500, batch_no: "B1102", expiry_date: daysFromISO(200), days_to_expiry: 200, snapshot_date: "2026-07-08", avg_daily_usage: 45.0, days_of_cover: 40.0, risk_level: "healthy", near_expiry: false, updated_via: "csv", data_confidence: "medium", confidence_reason_en: "Imported via CSV batch upload today.", confidence_reason_hi: "आज सीएसवी बैच अपलोड से आयात किया गया।" },
  { phc_id: "PHC-06", phc_name: "Faridpur PHC", medicine_id: "MED-04", medicine_name: "Iron Folic Acid", stock_qty: 1200, min_safety_stock: 400, batch_no: "B5540", expiry_date: daysFromISO(150), days_to_expiry: 150, snapshot_date: "2026-07-08", avg_daily_usage: 22.0, days_of_cover: 54.5, risk_level: "healthy", near_expiry: false, updated_via: "app", data_confidence: "high", confidence_reason_en: "Updated today via smartphone app.", confidence_reason_hi: "आज स्मार्टफोन ऐप से अपडेट किया गया।" },
  { phc_id: "PHC-07", phc_name: "Mirganj PHC", medicine_id: "MED-06", medicine_name: "ORS + Zinc Kit", stock_qty: 120, min_safety_stock: 150, batch_no: "B8890", expiry_date: daysFromISO(15), days_to_expiry: 15, snapshot_date: "2026-07-05", avg_daily_usage: 9.0, days_of_cover: 13.3, risk_level: "warning", near_expiry: true, reason_en: "Below safety stock and expires in 15 days", reason_hi: "सुरक्षा स्टॉक से नीचे और 15 दिनों में समाप्त", updated_via: "sms", data_confidence: "low", confidence_reason_en: "Recorded via SMS 3 days ago — confirm on site.", confidence_reason_hi: "3 दिन पहले एसएमएस से दर्ज — मौके पर पुष्टि करें।" },
  { phc_id: "PHC-05", phc_name: "Nawabganj CHC", medicine_id: "MED-05", medicine_name: "Metformin 500mg", stock_qty: 900, min_safety_stock: 250, batch_no: "B4410", expiry_date: daysFromISO(220), days_to_expiry: 220, snapshot_date: "2026-07-08", avg_daily_usage: 28.0, days_of_cover: 32.1, risk_level: "healthy", near_expiry: false, updated_via: "barcode", data_confidence: "high", confidence_reason_en: "Updated today via barcode/system sync.", confidence_reason_hi: "आज बारकोड/सिस्टम सिंक से अपडेट किया गया।" },
  { phc_id: "PHC-03", phc_name: "Sadar CHC", medicine_id: "MED-02", medicine_name: "Paracetamol 500mg", stock_qty: 640, min_safety_stock: 500, batch_no: "B1188", expiry_date: daysFromISO(9), days_to_expiry: 9, snapshot_date: "2026-07-08", avg_daily_usage: 52.0, days_of_cover: 12.3, risk_level: "warning", near_expiry: true, reason_en: "Batch expires in 9 days — move or use soon", reason_hi: "बैच 9 दिनों में समाप्त — जल्द उपयोग करें", updated_via: "app", data_confidence: "medium", confidence_reason_en: "Entered via smartphone app yesterday.", confidence_reason_hi: "कल स्मार्टफोन ऐप से दर्ज किया गया।" },
  { phc_id: "PHC-02", phc_name: "Kila PHC", medicine_id: "MED-01", medicine_name: "ORS Sachet", stock_qty: 460, min_safety_stock: 200, batch_no: "B2460", expiry_date: daysFromISO(95), days_to_expiry: 95, snapshot_date: "2026-07-08", avg_daily_usage: 20.0, days_of_cover: 23.0, risk_level: "healthy", near_expiry: false, updated_via: "csv", data_confidence: "medium", confidence_reason_en: "Imported via CSV batch upload today.", confidence_reason_hi: "आज सीएसवी बैच अपलोड से आयात किया गया।" },
  { phc_id: "PHC-01", phc_name: "Rampur PHC", medicine_id: "MED-03", medicine_name: "Amoxicillin 250mg", stock_qty: 280, min_safety_stock: 300, batch_no: "B7799", expiry_date: daysFromISO(110), days_to_expiry: 110, snapshot_date: "2026-07-06", avg_daily_usage: 16.0, days_of_cover: 17.5, risk_level: "warning", near_expiry: false, reason_en: "Just below safety stock level", reason_hi: "सुरक्षा स्टॉक स्तर से थोड़ा नीचे", updated_via: "manual", data_confidence: "low", confidence_reason_en: "Manual register entry 2 days old.", confidence_reason_hi: "मैनुअल रजिस्टर प्रविष्टि 2 दिन पुरानी।" },
];

// ---- Forecast --------------------------------------------------------------

export function mockForecast(phc_id: string, medicine_id: string): Forecast {
  const history = Array.from({ length: 18 }).map((_, i) => ({
    date: daysAgoISO(18 - i),
    usage: 26 + Math.round(Math.sin(i / 2.2) * 7 + i * 0.6),
  }));
  const last = history[history.length - 1].usage;
  const forecast = Array.from({ length: 14 }).map((_, i) => {
    const predicted = Math.round((last + i * 0.9 + Math.sin(i / 2) * 4) * 10) / 10;
    return {
      date: daysFromISO(i + 1),
      predicted,
      lower: Math.round((predicted - 4 - i * 0.3) * 10) / 10,
      upper: Math.round((predicted + 4 + i * 0.4) * 10) / 10,
    };
  });
  return {
    phc_id,
    medicine_id,
    horizon_days: 14,
    model: "gradient_boosting",
    model_version: "1.0.0",
    history,
    forecast,
    risk_score: 0.78,
    explain: {
      top_factors_en: [
        "7-day usage trend rising",
        "Monsoon season increases diarrhoeal cases",
        "Current stock below safety level",
        "Recent OPD footfall spike",
      ],
      top_factors_hi: [
        "7-दिन उपयोग रुझान बढ़ रहा है",
        "मानसून में दस्त के मामले बढ़ते हैं",
        "वर्तमान स्टॉक सुरक्षा स्तर से नीचे",
        "हालिया ओपीडी आवक में उछाल",
      ],
    },
  };
}

export const mockForecastMetrics: ForecastMetrics = {
  model: "gradient_boosting",
  baseline: "moving_average",
  metrics: { MAE: 5.2, RMSE: 7.1, MAPE: 13.4, WAPE: 11.8, bias: -0.6 },
  baseline_metrics: { MAE: 8.9, RMSE: 11.2, MAPE: 22.1, WAPE: 19.7, bias: 1.2 },
  improvement_pct: 41.6,
};

// ---- Recommendations -------------------------------------------------------

// Base template so each recommendation only needs to override meaningful fields.
function baseRec(over: Partial<Recommendation> & Pick<Recommendation, "recommendation_id">): Recommendation {
  return {
    transfer_type: "redistribution",
    source_phc_id: "PHC-01",
    source_phc_name: "Rampur PHC",
    target_phc_id: "PHC-03",
    target_phc_name: "Sadar CHC",
    medicine_id: "MED-01",
    medicine_name: "ORS Sachet",
    unit: "sachet",
    suggested_qty: 100,
    urgency: "medium",
    priority_score: 0.7,
    distance_km: 10,
    batch_no: "B0000",
    expiry_date: daysFromISO(60),
    cold_chain: false,
    storage_condition: "Room temperature",
    predicted_stockout_date: daysFromISO(4),
    source_buffer_days_after: 21,
    logistics_model: "piggyback",
    emergency: false,
    escalation_level: "none",
    confidence: "high",
    confidence_reason_en: "Stock verified today via system sync.",
    confidence_reason_hi: "आज सिस्टम सिंक से स्टॉक सत्यापित किया गया।",
    expected_benefit_en: "",
    expected_benefit_hi: "",
    reason_en: "",
    reason_hi: "",
    status: "awaiting_verification",
    verified_by: null,
    verified_at: null,
    verified_qty: null,
    approved_by: null,
    approved_at: null,
    actual_qty: null,
    assigned_at: null,
    pickup_by: null,
    picked_up_at: null,
    received_qty: null,
    received_condition: null,
    delivered_at: null,
    stock_updated_at: null,
    reject_reason: null,
    modify_reason: null,
    created_at: "2026-07-08T09:00:00Z",
    ...over,
  };
}

export const mockRecommendations: Recommendation[] = [
  baseRec({
    recommendation_id: "REC-01", transfer_type: "redistribution",
    source_phc_id: "PHC-01", source_phc_name: "Rampur PHC", target_phc_id: "PHC-03", target_phc_name: "Sadar CHC",
    medicine_id: "MED-01", medicine_name: "ORS Sachet", unit: "sachet", suggested_qty: 120, urgency: "critical",
    priority_score: 0.95, distance_km: 8.1, batch_no: "B2455", expiry_date: daysFromISO(80), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: daysFromISO(3), source_buffer_days_after: 18,
    logistics_model: "piggyback", escalation_level: "none", confidence: "high",
    confidence_reason_en: "Stock at both PHCs verified today via barcode sync.",
    confidence_reason_hi: "दोनों पीएचसी में स्टॉक आज बारकोड सिंक से सत्यापित।",
    reason_en: "Sadar CHC is projected to run out of ORS in ~3 days, while Rampur PHC holds surplus and will still keep an 18-day buffer after transferring 120 sachet.",
    reason_hi: "सदर सीएचसी ~3 दिनों में ORS समाप्त होने का अनुमान; रामपुर पीएचसी के पास अधिशेष है और 120 सैशे भेजने के बाद भी 18-दिन बफर रहेगा।",
    expected_benefit_en: "Prevents an ORS stockout at Sadar CHC during the diarrhoeal season.",
    expected_benefit_hi: "दस्त मौसम में सदर सीएचसी में ORS स्टॉकआउट रोकता है।",
    status: "awaiting_verification", created_at: "2026-07-08T09:05:00Z",
  }),
  baseRec({
    recommendation_id: "REC-02", transfer_type: "redistribution",
    source_phc_id: "PHC-02", source_phc_name: "Kila PHC", target_phc_id: "PHC-05", target_phc_name: "Nawabganj CHC",
    medicine_id: "MED-01", medicine_name: "ORS Sachet", unit: "sachet", suggested_qty: 80, urgency: "high",
    priority_score: 0.88, distance_km: 12.4, batch_no: "B2460", expiry_date: daysFromISO(95), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: daysFromISO(4), source_buffer_days_after: 25,
    logistics_model: "hub_and_spoke", escalation_level: "supervisor", confidence: "medium",
    confidence_reason_en: "Source stock entered via app 2 days ago — physical check recommended.",
    confidence_reason_hi: "स्रोत स्टॉक 2 दिन पहले ऐप से दर्ज — भौतिक जांच अनुशंसित।",
    reason_en: "Nawabganj CHC runs out of ORS in ~4 days; Kila PHC holds surplus stock and retains a 25-day buffer after the transfer.",
    reason_hi: "नवाबगंज सीएचसी ~4 दिनों में ORS समाप्त; किला पीएचसी अधिशेष रखता है और स्थानांतरण के बाद 25-दिन बफर बरकरार।",
    expected_benefit_en: "Keeps ORS available at Nawabganj and reduces waste at Kila.",
    expected_benefit_hi: "नवाबगंज में ORS उपलब्ध रखता है और किला में बर्बादी घटाता है।",
    status: "awaiting_verification", created_at: "2026-07-08T09:00:00Z",
  }),
  baseRec({
    recommendation_id: "REC-03", transfer_type: "redistribution",
    source_phc_id: "PHC-05", source_phc_name: "Nawabganj CHC", target_phc_id: "PHC-08", target_phc_name: "Aonla CHC",
    medicine_id: "MED-07", medicine_name: "Anti-Snake Venom", unit: "vial", suggested_qty: 8, urgency: "critical",
    priority_score: 0.97, distance_km: 22.7, batch_no: "B3320", expiry_date: daysFromISO(120), cold_chain: true,
    storage_condition: "2–8°C cold chain", predicted_stockout_date: daysFromISO(1), source_buffer_days_after: 30,
    logistics_model: "emergency_lateral", emergency: true, escalation_level: "emergency", confidence: "low",
    confidence_reason_en: "Physical verification required before approval. Stock last updated 6 days ago.",
    confidence_reason_hi: "स्वीकृति से पहले भौतिक सत्यापन आवश्यक। स्टॉक 6 दिन पहले अपडेट किया गया।",
    reason_en: "Aonla CHC is down to 6 vials of Anti-Snake Venom in peak snakebite season and may run out within a day; Nawabganj can spare 8 vials and keep a 30-day buffer.",
    reason_hi: "सर्पदंश चरम मौसम में आंवला सीएचसी में केवल 6 ASV वायल, एक दिन में समाप्त हो सकते हैं; नवाबगंज 8 वायल दे सकता है और 30-दिन बफर रखता है।",
    expected_benefit_en: "Averts a life-threatening ASV stockout at Aonla CHC.",
    expected_benefit_hi: "आंवला सीएचसी में जानलेवा ASV स्टॉकआउट टालता है।",
    status: "awaiting_approval", verified_by: "pharmacist", verified_at: "2026-07-08T09:40:00Z", verified_qty: 8,
    created_at: "2026-07-08T09:10:00Z",
  }),
  baseRec({
    recommendation_id: "REC-04", transfer_type: "redistribution",
    source_phc_id: "PHC-02", source_phc_name: "Kila PHC", target_phc_id: "PHC-07", target_phc_name: "Mirganj PHC",
    medicine_id: "MED-03", medicine_name: "Amoxicillin 250mg", unit: "capsule", suggested_qty: 150, urgency: "medium",
    priority_score: 0.72, distance_km: 15.9, batch_no: "B7781", expiry_date: daysFromISO(21), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: daysFromISO(9), source_buffer_days_after: 22,
    logistics_model: "piggyback", escalation_level: "supervisor", confidence: "medium",
    confidence_reason_en: "Source figure entered via app 2 days ago.",
    confidence_reason_hi: "स्रोत आंकड़ा 2 दिन पहले ऐप से दर्ज।",
    reason_en: "Kila batch B7781 expires in 21 days and would be wasted; Mirganj demand can absorb it before expiry, keeping a 22-day buffer at Kila.",
    reason_hi: "किला बैच B7781 21 दिनों में समाप्त और बर्बाद होगा; मिरगंज मांग इसे समाप्ति से पहले खपा सकती है, किला में 22-दिन बफर रखते हुए।",
    expected_benefit_en: "Uses near-expiry amoxicillin before waste; covers Mirganj demand.",
    expected_benefit_hi: "बर्बादी से पहले समाप्ति-निकट एमोक्सिसिलिन का उपयोग; मिरगंज मांग पूरी करता है।",
    status: "awaiting_approval", verified_by: "pharmacist", verified_at: "2026-07-08T08:50:00Z", verified_qty: 140,
    created_at: "2026-07-08T09:15:00Z",
  }),
  baseRec({
    recommendation_id: "REC-05", transfer_type: "redistribution",
    source_phc_id: "PHC-06", source_phc_name: "Faridpur PHC", target_phc_id: "PHC-05", target_phc_name: "Nawabganj CHC",
    medicine_id: "MED-08", medicine_name: "Oxytocin Injection", unit: "ampoule", suggested_qty: 30, urgency: "high",
    priority_score: 0.84, distance_km: 18.2, batch_no: "B9012", expiry_date: daysFromISO(40), cold_chain: true,
    storage_condition: "2–8°C cold chain", predicted_stockout_date: daysFromISO(5), source_buffer_days_after: 20,
    logistics_model: "hub_and_spoke", escalation_level: "supervisor", confidence: "high",
    confidence_reason_en: "Both PHC stocks verified today.",
    confidence_reason_hi: "दोनों पीएचसी स्टॉक आज सत्यापित।",
    reason_en: "Nawabganj oxytocin is at 3.2 days of cover for a critical maternal drug; Faridpur holds surplus and keeps a 20-day buffer after transfer.",
    reason_hi: "नवाबगंज ऑक्सीटोसिन गंभीर मातृ दवा के लिए 3.2 दिन कवर; फरीदपुर अधिशेष रखता है और स्थानांतरण के बाद 20-दिन बफर।",
    expected_benefit_en: "Secures maternal drug supply at Nawabganj CHC.",
    expected_benefit_hi: "नवाबगंज सीएचसी में मातृ दवा आपूर्ति सुरक्षित करता है।",
    status: "approved", verified_by: "pharmacist", verified_at: "2026-07-08T08:20:00Z", verified_qty: 30,
    approved_by: "block_manager", approved_at: "2026-07-08T08:35:00Z", actual_qty: 30,
    created_at: "2026-07-07T18:20:00Z",
  }),
  baseRec({
    recommendation_id: "REC-06", transfer_type: "redistribution",
    source_phc_id: "PHC-04", source_phc_name: "Bhojipura PHC", target_phc_id: "PHC-03", target_phc_name: "Sadar CHC",
    medicine_id: "MED-02", medicine_name: "Paracetamol 500mg", unit: "tablet", suggested_qty: 300, urgency: "medium",
    priority_score: 0.68, distance_km: 10.3, batch_no: "B1102", expiry_date: daysFromISO(200), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: daysFromISO(7), source_buffer_days_after: 35,
    logistics_model: "piggyback", escalation_level: "none", confidence: "high",
    confidence_reason_en: "Stock verified today via CSV batch import.",
    confidence_reason_hi: "आज सीएसवी बैच आयात से स्टॉक सत्यापित।",
    reason_en: "Bhojipura holds 40 days of cover of paracetamol; Sadar batch is near expiry and demand is rising ahead of fever season.",
    reason_hi: "भोजीपुरा में पैरासिटामोल का 40 दिन कवर; सदर बैच समाप्ति के करीब और बुखार मौसम से पहले मांग बढ़ रही है।",
    expected_benefit_en: "Balances paracetamol ahead of the fever season.",
    expected_benefit_hi: "बुखार मौसम से पहले पैरासिटामोल संतुलित करता है।",
    status: "assigned", verified_by: "pharmacist", verified_at: "2026-07-07T12:00:00Z", verified_qty: 300,
    approved_by: "block_manager", approved_at: "2026-07-07T13:00:00Z", actual_qty: 300,
    assigned_at: "2026-07-07T14:00:00Z", created_at: "2026-07-07T10:00:00Z",
  }),
  baseRec({
    recommendation_id: "REC-07", transfer_type: "redistribution",
    source_phc_id: "PHC-01", source_phc_name: "Rampur PHC", target_phc_id: "PHC-07", target_phc_name: "Mirganj PHC",
    medicine_id: "MED-06", medicine_name: "ORS + Zinc Kit", unit: "kit", suggested_qty: 40, urgency: "high",
    priority_score: 0.8, distance_km: 14.2, batch_no: "B8890", expiry_date: daysFromISO(60), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: daysFromISO(6), source_buffer_days_after: 24,
    logistics_model: "piggyback", escalation_level: "supervisor", confidence: "high",
    confidence_reason_en: "Verified stock; transfer in transit.",
    confidence_reason_hi: "सत्यापित स्टॉक; स्थानांतरण मार्ग में।",
    reason_en: "Mirganj is below safety stock on ORS + Zinc kits; Rampur can spare 40 kits and keep a 24-day buffer.",
    reason_hi: "मिरगंज ORS + जिंक किट पर सुरक्षा स्टॉक से नीचे; रामपुर 40 किट दे सकता है और 24-दिन बफर रखता है।",
    expected_benefit_en: "Restores ORS + Zinc buffer at Mirganj PHC.",
    expected_benefit_hi: "मिरगंज पीएचसी में ORS + जिंक बफर बहाल करता है।",
    status: "picked_up", verified_by: "pharmacist", verified_at: "2026-07-07T11:00:00Z", verified_qty: 40,
    approved_by: "block_manager", approved_at: "2026-07-07T11:30:00Z", actual_qty: 40,
    assigned_at: "2026-07-07T12:00:00Z", pickup_by: "driver_ramesh", picked_up_at: "2026-07-08T07:30:00Z",
    created_at: "2026-07-07T09:00:00Z",
  }),
  baseRec({
    recommendation_id: "REC-08", transfer_type: "redistribution",
    source_phc_id: "PHC-02", source_phc_name: "Kila PHC", target_phc_id: "PHC-05", target_phc_name: "Nawabganj CHC",
    medicine_id: "MED-05", medicine_name: "Metformin 500mg", unit: "tablet", suggested_qty: 200, urgency: "low",
    priority_score: 0.5, distance_km: 16.5, batch_no: "B4410", expiry_date: daysFromISO(220), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: daysFromISO(12), source_buffer_days_after: 40,
    logistics_model: "piggyback", escalation_level: "none", confidence: "high",
    confidence_reason_en: "Completed and inventory reconciled.",
    confidence_reason_hi: "पूर्ण और इन्वेंटरी मिलान किया गया।",
    reason_en: "Routine rebalancing of metformin surplus from Kila to Nawabganj ahead of the chronic-care clinic day.",
    reason_hi: "क्रोनिक-केयर क्लिनिक दिवस से पहले किला से नवाबगंज को मेटफॉर्मिन अधिशेष का नियमित पुनर्संतुलन।",
    expected_benefit_en: "Avoided a projected metformin shortfall at Nawabganj.",
    expected_benefit_hi: "नवाबगंज में अनुमानित मेटफॉर्मिन कमी टाली गई।",
    status: "stock_updated", verified_by: "pharmacist", verified_at: "2026-07-06T10:00:00Z", verified_qty: 200,
    approved_by: "block_manager", approved_at: "2026-07-06T10:30:00Z", actual_qty: 200,
    assigned_at: "2026-07-06T11:00:00Z", pickup_by: "driver_suresh", picked_up_at: "2026-07-06T13:00:00Z",
    received_qty: 200, received_condition: "good", delivered_at: "2026-07-06T16:00:00Z",
    stock_updated_at: "2026-07-06T16:05:00Z", created_at: "2026-07-06T09:00:00Z",
  }),
  baseRec({
    recommendation_id: "REC-09", transfer_type: "return_to_store",
    source_phc_id: "PHC-02", source_phc_name: "Kila PHC", target_phc_id: "STORE-DIST", target_phc_name: "Block/District Store",
    medicine_id: "MED-03", medicine_name: "Amoxicillin 250mg", unit: "capsule", suggested_qty: 200, urgency: "medium",
    priority_score: 0.6, distance_km: 20.0, batch_no: "B7781", expiry_date: daysFromISO(21), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: null, source_buffer_days_after: 30,
    logistics_model: "return_to_store", escalation_level: "district_officer", confidence: "medium",
    confidence_reason_en: "Surplus flagged for return; verify count before dispatch.",
    confidence_reason_hi: "वापसी हेतु अधिशेष चिह्नित; प्रेषण से पहले गिनती सत्यापित करें।",
    reason_en: "Kila holds a large amoxicillin surplus that no nearby PHC can absorb before expiry; returning 200 capsules to the district store enables redistribution elsewhere.",
    reason_hi: "किला में बड़ा एमोक्सिसिलिन अधिशेष जिसे कोई निकट पीएचसी समाप्ति से पहले नहीं खपा सकता; 200 कैप्सूल जिला भंडार को लौटाने से अन्यत्र पुनर्वितरण संभव।",
    expected_benefit_en: "Prevents waste and lets the district redistribute stock centrally.",
    expected_benefit_hi: "बर्बादी रोकता है और जिले को केंद्रीय रूप से स्टॉक पुनर्वितरण देता है।",
    status: "awaiting_approval", verified_by: "pharmacist", verified_at: "2026-07-08T08:00:00Z", verified_qty: 200,
    created_at: "2026-07-08T07:45:00Z",
  }),
  baseRec({
    recommendation_id: "REC-10", transfer_type: "redistribution",
    source_phc_id: "PHC-08", source_phc_name: "Aonla CHC", target_phc_id: "PHC-06", target_phc_name: "Faridpur PHC",
    medicine_id: "MED-04", medicine_name: "Iron Folic Acid", unit: "tablet", suggested_qty: 250, urgency: "low",
    priority_score: 0.45, distance_km: 24.0, batch_no: "B5540", expiry_date: daysFromISO(150), cold_chain: false,
    storage_condition: "Room temperature", predicted_stockout_date: daysFromISO(20), source_buffer_days_after: 15,
    logistics_model: "piggyback", escalation_level: "none", confidence: "very_low",
    confidence_reason_en: "Source figure is a 7-day-old manual entry — flagged unreliable.",
    confidence_reason_hi: "स्रोत आंकड़ा 7 दिन पुरानी मैनुअल प्रविष्टि — अविश्वसनीय चिह्नित।",
    reason_en: "Draft proposed moving Iron Folic Acid from Aonla to Faridpur, but the source count was found to be inaccurate on verification.",
    reason_hi: "मसौदे ने आंवला से फरीदपुर को आयरन फोलिक एसिड भेजने का प्रस्ताव दिया, पर सत्यापन पर स्रोत गिनती गलत पाई गई।",
    expected_benefit_en: "Would have topped up Faridpur's supplement stock.",
    expected_benefit_hi: "फरीदपुर के पूरक स्टॉक की भरपाई करता।",
    status: "rejected", reject_reason: "Physical verification showed Aonla has no real surplus — stock figure was stale.",
    verified_by: null, created_at: "2026-07-07T15:00:00Z",
  }),
];

// ---- Recommendation timeline (audit trail) --------------------------------

export function mockTimeline(id: string): TimelineEvent[] {
  const rec = mockRecommendations.find((r) => r.recommendation_id === id);
  const events: TimelineEvent[] = [
    { event: "created", actor: "ai_engine", note: "Draft proposal generated by optimizer.", at: rec?.created_at ?? "2026-07-08T09:00:00Z" },
  ];
  if (!rec) return events;
  if (rec.verified_at) events.push({ event: "verified", actor: rec.verified_by ?? "pharmacist", note: `Physically verified ${rec.verified_qty ?? rec.suggested_qty} ${rec.unit}.`, at: rec.verified_at });
  if (rec.approved_at) events.push({ event: "approved", actor: rec.approved_by ?? "block_manager", note: `Approved ${rec.actual_qty ?? rec.suggested_qty} ${rec.unit} for transfer.`, at: rec.approved_at });
  if (rec.assigned_at) events.push({ event: "assigned", actor: "block_manager", note: `Logistics assigned (${rec.logistics_model}).`, at: rec.assigned_at });
  if (rec.picked_up_at) events.push({ event: "picked_up", actor: rec.pickup_by ?? "driver", note: "Consignment picked up from source.", at: rec.picked_up_at });
  if (rec.delivered_at) events.push({ event: "confirmed", actor: "receiver", note: `Delivered — ${rec.received_qty ?? rec.suggested_qty} ${rec.unit} (${rec.received_condition ?? "good"}).`, at: rec.delivered_at });
  if (rec.stock_updated_at) events.push({ event: "stock_updated", actor: "system", note: "Inventory updated at both facilities.", at: rec.stock_updated_at });
  if (rec.status === "rejected") events.push({ event: "rejected", actor: "block_manager", note: rec.reject_reason ?? "Rejected.", at: rec.created_at });
  if (rec.emergency) events.push({ event: "emergency_marked", actor: "medical_officer", note: "Escalated to emergency lateral transfer.", at: rec.created_at });
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

// ---- Ingestion (low-connectivity fallbacks) -------------------------------

export function mockSmsIngest(message: string): SmsIngestResult {
  const tokens = message.trim().split(/\s+/);
  const phc = tokens.find((tkn) => /^PHC-\d+/i.test(tkn))?.toUpperCase() ?? "PHC-03";
  const qtyTok = tokens.find((tkn) => /^\d+$/.test(tkn));
  const batchIdx = tokens.findIndex((tkn) => /^BATCH$/i.test(tkn));
  const batch = batchIdx >= 0 ? tokens[batchIdx + 1] ?? "" : "ORS24A";
  const expIdx = tokens.findIndex((tkn) => /^EXP$/i.test(tkn));
  const expRaw = expIdx >= 0 ? tokens[expIdx + 1] ?? "" : "2026-12";
  const expiry = /^\d{4}-\d{2}$/.test(expRaw) ? `${expRaw}-28` : expRaw || "2026-12-28";
  return {
    ok: true, phc_id: phc, medicine_id: "MED-01", medicine_name: "ORS Sachet",
    stock_qty: qtyTok ? Number(qtyTok) : 120, batch_no: batch || "ORS24A", expiry_date: expiry,
    updated_via: "sms", data_confidence: "low",
    note_en: "Recorded via SMS — physical verification advised before transfer.",
    note_hi: "एसएमएस से दर्ज — स्थानांतरण से पहले भौतिक सत्यापन सलाह दी जाती है।",
  };
}

export function mockCsvIngest(csv: string): CsvIngestResult {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  const dataRows = Math.max(0, lines.length - 1);
  return {
    ok: true, inserted: dataRows, errors: [], updated_via: "csv", data_confidence: "medium",
  };
}

// ---- Alerts ----------------------------------------------------------------

export const mockAlerts: Alert[] = [
  { id: "AL-1", type: "shortage", risk_level: "critical", phc_id: "PHC-03", phc_name: "Sadar CHC", title_en: "ORS shortage imminent", title_hi: "ORS की कमी आसन्न", message_en: "Projected stockout in 3 days.", message_hi: "3 दिनों में स्टॉक समाप्त होने का अनुमान।", created_at: "2026-07-08T08:00:00Z" },
  { id: "AL-2", type: "expiry", risk_level: "warning", phc_id: "PHC-02", phc_name: "Kila PHC", title_en: "Amoxicillin nearing expiry", title_hi: "एमोक्सिसिलिन समाप्ति के करीब", message_en: "Batch B7781 expires in 21 days.", message_hi: "बैच B7781 21 दिनों में समाप्त।", created_at: "2026-07-08T07:40:00Z" },
  { id: "AL-3", type: "bed_full", risk_level: "critical", phc_id: "PHC-05", phc_name: "Nawabganj CHC", title_en: "ICU beds full", title_hi: "आईसीयू बेड भरे", message_en: "ICU at 100% occupancy — divert new admissions.", message_hi: "आईसीयू 100% अधिभोग — नए भर्ती को मोड़ें।", created_at: "2026-07-08T07:10:00Z" },
  { id: "AL-4", type: "test_down", risk_level: "warning", phc_id: "PHC-01", phc_name: "Rampur PHC", title_en: "Malaria RDT unavailable", title_hi: "मलेरिया RDT अनुपलब्ध", message_en: "Kit stock exhausted.", message_hi: "किट स्टॉक समाप्त।", created_at: "2026-07-08T06:30:00Z" },
  { id: "AL-5", type: "doctor_absent", risk_level: "warning", phc_id: "PHC-07", phc_name: "Mirganj PHC", title_en: "Only one doctor on duty", title_hi: "केवल एक डॉक्टर ड्यूटी पर", message_en: "2 of 3 doctors absent today.", message_hi: "आज 3 में से 2 डॉक्टर अनुपस्थित।", created_at: "2026-07-08T06:05:00Z" },
  { id: "AL-6", type: "spike", risk_level: "warning", phc_id: "PHC-08", phc_name: "Aonla CHC", title_en: "OPD footfall spike", title_hi: "ओपीडी आवक उछाल", message_en: "Footfall 35% above 2-week average.", message_hi: "आवक 2-सप्ताह औसत से 35% अधिक।", created_at: "2026-07-08T05:50:00Z" },
  { id: "AL-7", type: "transfer_due", risk_level: "warning", phc_id: "PHC-02", phc_name: "Kila PHC", title_en: "Transfer awaiting dispatch", title_hi: "स्थानांतरण प्रेषण की प्रतीक्षा में", message_en: "Approved ORS transfer to Nawabganj not yet dispatched.", message_hi: "नवाबगंज को स्वीकृत ORS स्थानांतरण अभी नहीं भेजा गया।", created_at: "2026-07-08T05:20:00Z" },
  { id: "AL-8", type: "shortage", risk_level: "critical", phc_id: "PHC-08", phc_name: "Aonla CHC", title_en: "Anti-Snake Venom critically low", title_hi: "एंटी-स्नेक वेनम बेहद कम", message_en: "6 vials left during snakebite season.", message_hi: "सर्पदंश मौसम में 6 वायल शेष।", created_at: "2026-07-08T04:40:00Z" },
  { id: "AL-9", type: "expiry", risk_level: "warning", phc_id: "PHC-03", phc_name: "Sadar CHC", title_en: "Paracetamol batch expiring", title_hi: "पैरासिटामोल बैच समाप्त हो रहा", message_en: "Batch B1188 expires in 9 days.", message_hi: "बैच B1188 9 दिनों में समाप्त।", created_at: "2026-07-08T04:10:00Z" },
];

// ---- Reports ---------------------------------------------------------------

export const mockReport: ReportSummary = {
  waste_avoided_units: 640,
  waste_avoided_value: 12800,
  stockouts_prevented: 14,
  transfer_completion_rate: 0.82,
  recommendation_acceptance_rate: 0.74,
  top_risky_medicines: [
    { medicine_id: "MED-01", name: "ORS Sachet", risk_score: 0.88 },
    { medicine_id: "MED-07", name: "Anti-Snake Venom", risk_score: 0.83 },
    { medicine_id: "MED-08", name: "Oxytocin Injection", risk_score: 0.79 },
    { medicine_id: "MED-03", name: "Amoxicillin 250mg", risk_score: 0.66 },
    { medicine_id: "MED-06", name: "ORS + Zinc Kit", risk_score: 0.61 },
  ],
  top_risky_phcs: [
    { phc_id: "PHC-03", name: "Sadar CHC", health_score: 0.42 },
    { phc_id: "PHC-05", name: "Nawabganj CHC", health_score: 0.48 },
    { phc_id: "PHC-08", name: "Aonla CHC", health_score: 0.53 },
    { phc_id: "PHC-07", name: "Mirganj PHC", health_score: 0.61 },
  ],
  trend: [
    { week: "2026-W22", stockouts: 9, waste: 140 },
    { week: "2026-W23", stockouts: 8, waste: 120 },
    { week: "2026-W24", stockouts: 6, waste: 105 },
    { week: "2026-W25", stockouts: 6, waste: 96 },
    { week: "2026-W26", stockouts: 5, waste: 90 },
    { week: "2026-W27", stockouts: 3, waste: 72 },
  ],
};

// ---- Beds ------------------------------------------------------------------

export const mockBeds: BedRecord[] = [
  { phc_id: "PHC-01", phc_name: "Rampur PHC", total_beds: 20, occupied_beds: 13, available_beds: 7, general: { total: 14, occupied: 9 }, icu: { total: 2, occupied: 2 }, maternity: { total: 4, occupied: 2 }, occupancy_rate: 0.65, status: "warning", updated_at: "2026-07-08T07:30:00Z" },
  { phc_id: "PHC-03", phc_name: "Sadar CHC", total_beds: 30, occupied_beds: 27, available_beds: 3, general: { total: 20, occupied: 18 }, icu: { total: 4, occupied: 4 }, maternity: { total: 6, occupied: 5 }, occupancy_rate: 0.9, status: "critical", updated_at: "2026-07-08T07:30:00Z" },
  { phc_id: "PHC-05", phc_name: "Nawabganj CHC", total_beds: 28, occupied_beds: 25, available_beds: 3, general: { total: 18, occupied: 16 }, icu: { total: 4, occupied: 4 }, maternity: { total: 6, occupied: 5 }, occupancy_rate: 0.89, status: "critical", updated_at: "2026-07-08T07:30:00Z" },
  { phc_id: "PHC-08", phc_name: "Aonla CHC", total_beds: 24, occupied_beds: 14, available_beds: 10, general: { total: 16, occupied: 9 }, icu: { total: 3, occupied: 2 }, maternity: { total: 5, occupied: 3 }, occupancy_rate: 0.58, status: "warning", updated_at: "2026-07-08T07:30:00Z" },
  { phc_id: "PHC-02", phc_name: "Kila PHC", total_beds: 16, occupied_beds: 6, available_beds: 10, general: { total: 12, occupied: 5 }, icu: { total: 1, occupied: 0 }, maternity: { total: 3, occupied: 1 }, occupancy_rate: 0.38, status: "healthy", updated_at: "2026-07-08T07:30:00Z" },
  { phc_id: "PHC-06", phc_name: "Faridpur PHC", total_beds: 18, occupied_beds: 8, available_beds: 10, general: { total: 13, occupied: 6 }, icu: { total: 2, occupied: 1 }, maternity: { total: 3, occupied: 1 }, occupancy_rate: 0.44, status: "healthy", updated_at: "2026-07-08T07:30:00Z" },
];

// ---- Footfall --------------------------------------------------------------

export function mockFootfall(phc_id?: string | null): Footfall {
  const series = Array.from({ length: 14 }).map((_, i) => {
    const opd = 150 + Math.round(Math.sin(i / 2) * 30 + i * 3);
    return { date: daysAgoISO(13 - i), opd, total: opd + 22 + Math.round(Math.cos(i) * 6) };
  });
  return {
    phc_id: phc_id ?? null,
    today: { opd: 180, ipd: 14, emergency: 6, total: 200 },
    series,
    avg_daily: 172,
    peak_hour: "10:00-11:00",
    ...(phc_id
      ? {}
      : {
          by_phc: [
            { phc_id: "PHC-03", phc_name: "Sadar CHC", total: 210 },
            { phc_id: "PHC-05", phc_name: "Nawabganj CHC", total: 188 },
            { phc_id: "PHC-08", phc_name: "Aonla CHC", total: 165 },
            { phc_id: "PHC-01", phc_name: "Rampur PHC", total: 142 },
            { phc_id: "PHC-06", phc_name: "Faridpur PHC", total: 121 },
            { phc_id: "PHC-02", phc_name: "Kila PHC", total: 98 },
          ],
        }),
  };
}

// ---- Doctors ---------------------------------------------------------------

export const mockDoctors: Doctor[] = [
  { phc_id: "PHC-01", phc_name: "Rampur PHC", doctor_name: "Dr. A. Sharma", specialty: "General Medicine", status: "present", expected: true, since: "2026-07-08T09:00:00Z" },
  { phc_id: "PHC-01", phc_name: "Rampur PHC", doctor_name: "Dr. R. Verma", specialty: "Paediatrics", status: "present", expected: true, since: "2026-07-08T09:10:00Z" },
  { phc_id: "PHC-03", phc_name: "Sadar CHC", doctor_name: "Dr. S. Khan", specialty: "General Surgery", status: "present", expected: true, since: "2026-07-08T08:45:00Z" },
  { phc_id: "PHC-03", phc_name: "Sadar CHC", doctor_name: "Dr. M. Gupta", specialty: "Obstetrics", status: "on_leave", expected: true, since: "2026-07-06T00:00:00Z" },
  { phc_id: "PHC-05", phc_name: "Nawabganj CHC", doctor_name: "Dr. P. Yadav", specialty: "General Medicine", status: "present", expected: true, since: "2026-07-08T09:05:00Z" },
  { phc_id: "PHC-07", phc_name: "Mirganj PHC", doctor_name: "Dr. N. Singh", specialty: "General Medicine", status: "absent", expected: true, since: "2026-07-08T00:00:00Z" },
  { phc_id: "PHC-07", phc_name: "Mirganj PHC", doctor_name: "Dr. K. Rao", specialty: "Paediatrics", status: "absent", expected: true, since: "2026-07-08T00:00:00Z" },
  { phc_id: "PHC-08", phc_name: "Aonla CHC", doctor_name: "Dr. L. Iyer", specialty: "Emergency Medicine", status: "present", expected: true, since: "2026-07-08T08:30:00Z" },
  { phc_id: "PHC-02", phc_name: "Kila PHC", doctor_name: "Dr. T. Bose", specialty: "General Medicine", status: "present", expected: true, since: "2026-07-08T09:20:00Z" },
  { phc_id: "PHC-06", phc_name: "Faridpur PHC", doctor_name: "Dr. V. Nair", specialty: "General Medicine", status: "present", expected: true, since: "2026-07-08T09:00:00Z" },
];

export function mockDoctorSummary(): DoctorSummary {
  return { present: 11, absent: 3, on_leave: 1, expected: 15, attendance_rate: 0.73 };
}

// ---- Tests -----------------------------------------------------------------

export const mockTests: TestRecord[] = [
  { phc_id: "PHC-01", phc_name: "Rampur PHC", test_name: "Malaria RDT", category: "Rapid Diagnostic", available: false, reason_en: "Kit stock exhausted", reason_hi: "किट स्टॉक समाप्त", updated_at: "2026-07-08T06:00:00Z" },
  { phc_id: "PHC-03", phc_name: "Sadar CHC", test_name: "Complete Blood Count", category: "Haematology", available: true, updated_at: "2026-07-08T06:30:00Z" },
  { phc_id: "PHC-03", phc_name: "Sadar CHC", test_name: "Blood Glucose", category: "Biochemistry", available: true, updated_at: "2026-07-08T06:30:00Z" },
  { phc_id: "PHC-05", phc_name: "Nawabganj CHC", test_name: "Ultrasound", category: "Imaging", available: false, reason_en: "Radiographer on leave", reason_hi: "रेडियोग्राफर छुट्टी पर", updated_at: "2026-07-08T06:15:00Z" },
  { phc_id: "PHC-08", phc_name: "Aonla CHC", test_name: "Dengue NS1", category: "Rapid Diagnostic", available: false, reason_en: "Reagent expired", reason_hi: "अभिकर्मक समाप्त", updated_at: "2026-07-08T05:40:00Z" },
  { phc_id: "PHC-02", phc_name: "Kila PHC", test_name: "Urine Routine", category: "Pathology", available: true, updated_at: "2026-07-08T06:20:00Z" },
  { phc_id: "PHC-06", phc_name: "Faridpur PHC", test_name: "Pregnancy Test", category: "Rapid Diagnostic", available: true, updated_at: "2026-07-08T06:10:00Z" },
  { phc_id: "PHC-07", phc_name: "Mirganj PHC", test_name: "ECG", category: "Cardiology", available: true, updated_at: "2026-07-08T05:55:00Z" },
];

// ---- District --------------------------------------------------------------

export const mockDistrict: DistrictOverview = {
  district: "Bareilly",
  phc_scores: [
    { phc_id: "PHC-03", name: "Sadar CHC", type: "CHC", latitude: 28.85, longitude: 79.10, health_score: 0.42, risk_level: "critical", stock_risk: 0.7, bed_pressure: 0.9, doctor_gap: 0.4, test_gap: 0.3, flagged: true, flag_reason_en: "High bed pressure + 3 stockout risks + beds near full", flag_reason_hi: "अधिक बेड दबाव + 3 स्टॉक जोखिम + बेड लगभग भरे" },
    { phc_id: "PHC-05", name: "Nawabganj CHC", type: "CHC", latitude: 28.53, longitude: 79.63, health_score: 0.48, risk_level: "critical", stock_risk: 0.65, bed_pressure: 0.89, doctor_gap: 0.2, test_gap: 0.5, flagged: true, flag_reason_en: "ICU full + oxytocin shortage + ultrasound down", flag_reason_hi: "आईसीयू भरा + ऑक्सीटोसिन कमी + अल्ट्रासाउंड बंद" },
    { phc_id: "PHC-08", name: "Aonla CHC", type: "CHC", latitude: 28.27, longitude: 79.16, health_score: 0.53, risk_level: "warning", stock_risk: 0.6, bed_pressure: 0.58, doctor_gap: 0.3, test_gap: 0.5, flagged: true, flag_reason_en: "Anti-Snake Venom critically low + Dengue NS1 down", flag_reason_hi: "एंटी-स्नेक वेनम बेहद कम + डेंगू NS1 बंद" },
    { phc_id: "PHC-07", name: "Mirganj PHC", type: "PHC", latitude: 28.42, longitude: 79.32, health_score: 0.61, risk_level: "warning", stock_risk: 0.4, bed_pressure: 0.3, doctor_gap: 0.67, test_gap: 0.1, flagged: false, flag_reason_en: "", flag_reason_hi: "" },
    { phc_id: "PHC-01", name: "Rampur PHC", type: "PHC", latitude: 28.81, longitude: 79.02, health_score: 0.72, risk_level: "warning", stock_risk: 0.35, bed_pressure: 0.65, doctor_gap: 0.1, test_gap: 0.33, flagged: false, flag_reason_en: "", flag_reason_hi: "" },
    { phc_id: "PHC-06", name: "Faridpur PHC", type: "PHC", latitude: 28.21, longitude: 79.53, health_score: 0.79, risk_level: "healthy", stock_risk: 0.2, bed_pressure: 0.44, doctor_gap: 0.1, test_gap: 0.0, flagged: false, flag_reason_en: "", flag_reason_hi: "" },
    { phc_id: "PHC-02", name: "Kila PHC", type: "PHC", latitude: 28.36, longitude: 79.41, health_score: 0.83, risk_level: "healthy", stock_risk: 0.25, bed_pressure: 0.38, doctor_gap: 0.0, test_gap: 0.0, flagged: false, flag_reason_en: "", flag_reason_hi: "" },
    { phc_id: "PHC-04", name: "Bhojipura PHC", type: "PHC", latitude: 28.53, longitude: 79.55, health_score: 0.86, risk_level: "healthy", stock_risk: 0.15, bed_pressure: 0.35, doctor_gap: 0.0, test_gap: 0.0, flagged: false, flag_reason_en: "", flag_reason_hi: "" },
  ],
  flagged_count: 3,
  district_kpis: { avg_health_score: 0.68, total_phcs: 8, critical_phcs: 3 },
};

// ---- AI assistant (Gemini) -------------------------------------------------
// Offline fallback so the "Ask the District" page and status badge still work
// when the backend / Gemini is unreachable during a live demo.

export const mockAssistantStatus: AssistantStatus = {
  gemini_enabled: false,
  model: "gemini-1.5-flash",
  mode: "fallback",
  note_en: "AI is running in offline mode — answers use bundled demo data, not live Gemini.",
  note_hi: "एआई ऑफ़लाइन मोड में चल रहा है — उत्तर बंडल डेमो डेटा से हैं, लाइव जेमिनी से नहीं।",
};

const mockGrounding = { flagged_centres: 3, critical_items: 5, open_transfers: 4 };

/** Build a grounded, deterministic offline answer from the mock district data. */
export function mockAssistantAnswer(question: string, _lang: Lang): AssistantAnswer {
  const q = question.toLowerCase();
  let answer_en: string;
  let answer_hi: string;

  if (q.includes("insulin") || q.includes("stock") || q.includes("run out") || q.includes("stockout")) {
    answer_en =
      "3 of 8 centres are at critical stock risk this week. Sadar CHC and Nawabganj CHC show the earliest predicted stockouts (Oxytocin and Anti-Snake Venom); a transfer from Bhojipura PHC is already proposed. Verify physical stock before approving.";
    answer_hi =
      "8 में से 3 केंद्र इस सप्ताह गंभीर स्टॉक जोखिम पर हैं। सदर सीएचसी और नवाबगंज सीएचसी में सबसे जल्दी स्टॉकआउट अनुमानित है (ऑक्सीटोसिन और एंटी-स्नेक वेनम); भोजीपुरा पीएचसी से स्थानांतरण पहले ही प्रस्तावित है। स्वीकृति से पहले भौतिक स्टॉक सत्यापित करें।";
  } else if (q.includes("bed") || q.includes("icu")) {
    answer_en =
      "Bed pressure is highest at Sadar CHC and Nawabganj CHC, both running near-full ICUs. Consider diverting non-emergency admissions to Aonla CHC, which has spare general capacity.";
    answer_hi =
      "बेड दबाव सदर सीएचसी और नवाबगंज सीएचसी में सबसे अधिक है, दोनों की आईसीयू लगभग भरी हैं। गैर-आपातकालीन भर्ती को आंवला सीएचसी की ओर मोड़ने पर विचार करें, जहाँ जनरल क्षमता उपलब्ध है।";
  } else {
    answer_en =
      "Across the district, 3 centres are flagged for intervention and 4 stock transfers are open for approval. Sadar CHC has the lowest health score (0.42). Ask about a specific medicine, PHC, or beds for a more detailed answer.";
    answer_hi =
      "पूरे जिले में, 3 केंद्र हस्तक्षेप हेतु चिह्नित हैं और 4 स्टॉक स्थानांतरण स्वीकृति हेतु लंबित हैं। सदर सीएचसी का स्वास्थ्य स्कोर सबसे कम (0.42) है। किसी विशेष दवा, पीएचसी या बेड के बारे में पूछें।";
  }

  return {
    question,
    answer_en,
    answer_hi,
    source: "fallback",
    grounding: { ...mockGrounding },
  };
}

/** Offline fallback briefing for a single recommendation. */
export function mockRecommendationBriefing(id: string): RecommendationBriefing {
  const rec = mockRecommendations.find((r) => r.recommendation_id === id) ?? mockRecommendations[0];
  const qty = `${rec.suggested_qty} ${rec.unit}`;
  return {
    recommendation_id: id,
    briefing_en: `Move ${qty} of ${rec.medicine_name} from ${rec.source_phc_name} to ${rec.target_phc_name} (${rec.distance_km.toFixed(1)} km). Urgency is ${rec.urgency}; the source keeps a safe buffer afterwards. This prevents a predicted stockout while avoiding waste. Confirm physical stock at the source before approving.`,
    briefing_hi: `${rec.source_phc_name} से ${rec.target_phc_name} (${rec.distance_km.toFixed(1)} किमी) तक ${rec.medicine_name} की ${qty} भेजें। अत्यावश्यकता ${rec.urgency} है; स्रोत बाद में सुरक्षित बफर रखता है। इससे अनुमानित स्टॉकआउट रुकता है और बर्बादी टलती है। स्वीकृति से पहले स्रोत पर भौतिक स्टॉक की पुष्टि करें।`,
    source: "fallback",
  };
}
