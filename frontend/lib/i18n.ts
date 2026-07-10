import type { Lang } from "./types";

// UI chrome strings. API text uses *_en / *_hi fields handled separately.
export const dict = {
  appName: { en: "Smart Health", hi: "स्मार्ट हेल्थ" },
  appTagline: {
    en: "AI control room for PHC stock planning",
    hi: "पीएचसी स्टॉक नियोजन के लिए एआई कंट्रोल रूम",
  },

  // Nav
  nav_dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  nav_inventory: { en: "Inventory", hi: "इन्वेंटरी" },
  nav_forecast: { en: "Forecast", hi: "पूर्वानुमान" },
  nav_recommendations: { en: "Recommendations", hi: "सिफारिशें" },
  nav_alerts: { en: "Alerts", hi: "अलर्ट" },
  nav_reports: { en: "Reports", hi: "रिपोर्ट" },
  nav_beds: { en: "Beds", hi: "बेड" },
  nav_footfall: { en: "Footfall", hi: "मरीज़ आवक" },
  nav_doctors: { en: "Doctors", hi: "डॉक्टर" },
  nav_tests: { en: "Tests", hi: "जांच" },
  nav_district: { en: "District", hi: "जिला" },
  nav_map: { en: "Facility map", hi: "केंद्र मानचित्र" },
  nav_ingest: { en: "Stock update", hi: "स्टॉक अपडेट" },
  nav_group_operations: { en: "Operations", hi: "संचालन" },
  nav_group_planning: { en: "Planning", hi: "नियोजन" },
  nav_group_intelligence: { en: "Intelligence", hi: "इंटेलिजेंस" },

  // Roles
  role_pharmacist: { en: "Pharmacist", hi: "फार्मासिस्ट" },
  role_medical_officer: { en: "Medical Officer", hi: "चिकित्सा अधिकारी" },
  role_block_manager: { en: "Block Manager", hi: "ब्लॉक प्रबंधक" },
  role_district_officer: { en: "District Officer", hi: "जिला अधिकारी" },
  role_admin: { en: "Administrator", hi: "प्रशासक" },

  // Per-role control-view focus (login card + dashboard subtitle)
  focus_pharmacist: {
    en: "Stock levels, expiry and stock updates for your PHC",
    hi: "आपके पीएचसी के लिए स्टॉक स्तर, समाप्ति और स्टॉक अपडेट",
  },
  focus_medical_officer: {
    en: "Beds, doctors, footfall and diagnostics at your facility",
    hi: "आपकी सुविधा में बेड, डॉक्टर, मरीज़ आवक और जांच",
  },
  focus_block_manager: {
    en: "Forecasts, transfer approvals and reports across PHCs",
    hi: "पीएचसी में पूर्वानुमान, स्थानांतरण स्वीकृति और रिपोर्ट",
  },
  focus_district_officer: {
    en: "District-wide intelligence, scoring and oversight",
    hi: "जिला-स्तरीय इंटेलिजेंस, स्कोरिंग और निगरानी",
  },
  focus_admin: {
    en: "Full system access across every module",
    hi: "हर मॉड्यूल में पूर्ण सिस्टम पहुंच",
  },

  // Login
  login_title: { en: "Sign in to continue", hi: "जारी रखने के लिए साइन इन करें" },
  login_subtitle: {
    en: "Choose your role to open the right control view.",
    hi: "सही नियंत्रण दृश्य खोलने के लिए अपनी भूमिका चुनें।",
  },
  login_cta: { en: "Enter control room", hi: "कंट्रोल रूम में प्रवेश करें" },
  login_pick_role: { en: "Select a role", hi: "एक भूमिका चुनें" },
  login_demo_note: {
    en: "Demo mode — no password needed. Runs even if the backend is offline.",
    hi: "डेमो मोड — पासवर्ड की आवश्यकता नहीं। बैकएंड ऑफ़लाइन होने पर भी चलता है।",
  },

  // Top nav
  scope_all: { en: "All PHCs (District)", hi: "सभी पीएचसी (जिला)" },
  scope_label: { en: "Scope", hi: "क्षेत्र" },
  signed_in_as: { en: "Signed in as", hi: "साइन इन:" },
  switch_role: { en: "Switch role", hi: "भूमिका बदलें" },
  language: { en: "Language", hi: "भाषा" },

  // KPIs
  kpi_shortage_risk: { en: "Items at shortage risk", hi: "कमी जोखिम वाली वस्तुएं" },
  kpi_near_expiry: { en: "Items near expiry", hi: "समाप्ति के करीब वस्तुएं" },
  kpi_pending_recs: { en: "Transfers in progress", hi: "प्रगति में स्थानांतरण" },
  kpi_beds_available: { en: "Beds available", hi: "उपलब्ध बेड" },
  kpi_doctors_present: { en: "Doctors present", hi: "उपस्थित डॉक्टर" },
  kpi_footfall_today: { en: "Footfall today", hi: "आज मरीज़ आवक" },
  kpi_tests_unavailable: { en: "Tests unavailable", hi: "अनुपलब्ध जांच" },
  kpi_active_alerts: { en: "Active alerts", hi: "सक्रिय अलर्ट" },

  // Dashboard sections
  sec_stock_health: { en: "Stock health", hi: "स्टॉक स्थिति" },
  sec_demand_trend: { en: "Demand trend", hi: "मांग रुझान" },
  sec_top_alerts: { en: "Top alerts", hi: "प्रमुख अलर्ट" },
  sec_quick_links: { en: "Quick links", hi: "त्वरित लिंक" },
  predicted: { en: "Predicted", hi: "अनुमानित" },
  actual: { en: "Actual", hi: "वास्तविक" },

  // Inventory
  inv_title: { en: "Inventory", hi: "इन्वेंटरी" },
  inv_subtitle: {
    en: "Stock levels, days of cover, and expiry risk across PHCs.",
    hi: "पीएचसी में स्टॉक स्तर, कवर के दिन और समाप्ति जोखिम।",
  },
  col_phc: { en: "PHC", hi: "पीएचसी" },
  col_medicine: { en: "Medicine", hi: "दवा" },
  col_stock: { en: "Stock", hi: "स्टॉक" },
  col_safety: { en: "Safety stock", hi: "सुरक्षा स्टॉक" },
  col_usage: { en: "Daily usage", hi: "दैनिक उपयोग" },
  col_cover: { en: "Days of cover", hi: "कवर के दिन" },
  col_expiry: { en: "Expiry", hi: "समाप्ति" },
  col_risk: { en: "Risk", hi: "जोखिम" },
  filter_all_phcs: { en: "All PHCs", hi: "सभी पीएचसी" },
  filter_all_medicines: { en: "All medicines", hi: "सभी दवाएं" },
  filter_all_risk: { en: "All risk levels", hi: "सभी जोखिम स्तर" },
  near_expiry_flag: { en: "Near expiry", hi: "समाप्ति निकट" },
  days_short: { en: "d", hi: "दि" },
  col_confidence: { en: "Data confidence", hi: "डेटा विश्वास" },
  updated_via_label: { en: "Source", hi: "स्रोत" },

  // Forecast
  fc_title: { en: "Demand forecast", hi: "मांग पूर्वानुमान" },
  fc_subtitle: {
    en: "History plus predicted usage with confidence band.",
    hi: "इतिहास और विश्वास बैंड के साथ अनुमानित उपयोग।",
  },
  fc_select_phc: { en: "PHC", hi: "पीएचसी" },
  fc_select_medicine: { en: "Medicine", hi: "दवा" },
  fc_history: { en: "History", hi: "इतिहास" },
  fc_forecast: { en: "Forecast", hi: "पूर्वानुमान" },
  fc_band: { en: "Confidence band", hi: "विश्वास बैंड" },
  fc_risk_score: { en: "Stockout risk score", hi: "स्टॉकआउट जोखिम स्कोर" },
  fc_model_metrics: { en: "Model performance", hi: "मॉडल प्रदर्शन" },
  fc_model: { en: "Model", hi: "मॉडल" },
  fc_baseline: { en: "Baseline", hi: "आधाररेखा" },
  fc_improvement: { en: "Improvement vs baseline", hi: "आधाररेखा से सुधार" },
  fc_why: { en: "Why this forecast", hi: "यह पूर्वानुमान क्यों" },
  fc_top_factors: { en: "Top contributing factors", hi: "प्रमुख योगदान कारक" },

  // Recommendations — supervisor approval queue
  rec_title: { en: "Supervisor approval queue", hi: "पर्यवेक्षक स्वीकृति कतार" },
  rec_subtitle: {
    en: "Verify, approve and track every proposed stock transfer.",
    hi: "प्रत्येक प्रस्तावित स्टॉक स्थानांतरण को सत्यापित, स्वीकृत और ट्रैक करें।",
  },
  rec_governance: {
    en: "The system does not move stock autonomously — it proposes; supervisors decide.",
    hi: "सिस्टम स्वयं स्टॉक नहीं हिलाता — यह प्रस्ताव देता है; पर्यवेक्षक निर्णय लेते हैं।",
  },
  rec_governance_sub: {
    en: "Every AI recommendation is a draft. A human must verify the physical stock and approve before anything moves.",
    hi: "हर एआई सिफारिश एक मसौदा है। कुछ भी हिलने से पहले एक मानव को भौतिक स्टॉक सत्यापित कर स्वीकृति देनी होगी।",
  },
  rec_regenerate: { en: "Regenerate", hi: "पुनः तैयार करें" },
  rec_approve: { en: "Approve", hi: "स्वीकृत करें" },
  rec_reject: { en: "Reject", hi: "अस्वीकार करें" },
  rec_move: { en: "Move", hi: "भेजें" },
  rec_from: { en: "From", hi: "से" },
  rec_to: { en: "To", hi: "तक" },
  rec_distance: { en: "Distance", hi: "दूरी" },
  rec_priority: { en: "Priority", hi: "प्राथमिकता" },
  rec_reason: { en: "Reason", hi: "कारण" },
  rec_status: { en: "Status", hi: "स्थिति" },
  rec_filter_status: { en: "Filter by status", hi: "स्थिति से फ़िल्टर" },
  rec_filter_transfer: { en: "Transfer type", hi: "स्थानांतरण प्रकार" },

  // Card meta
  rec_batch: { en: "Batch", hi: "बैच" },
  rec_expiry: { en: "Expiry", hi: "समाप्ति" },
  rec_cold_chain: { en: "Cold chain", hi: "कोल्ड चेन" },
  rec_storage: { en: "Storage", hi: "भंडारण" },
  rec_stockout_by: { en: "Predicted stockout", hi: "अनुमानित स्टॉकआउट" },
  rec_buffer_after: { en: "Source keeps {n}-day buffer", hi: "स्रोत {n}-दिन बफर रखता है" },
  rec_benefit: { en: "Expected benefit", hi: "अपेक्षित लाभ" },
  rec_return_store: { en: "Block/District Store", hi: "ब्लॉक/जिला भंडार" },
  rec_verify_hint: {
    en: "Confidence is not high — verify physical stock before approval.",
    hi: "विश्वास उच्च नहीं है — स्वीकृति से पहले भौतिक स्टॉक सत्यापित करें।",
  },

  // Transfer types
  transfer_redistribution: { en: "Redistribution", hi: "पुनर्वितरण" },
  transfer_return_to_store: { en: "Return to store", hi: "भंडार वापसी" },

  // Logistics models
  logi_piggyback: { en: "Piggyback route", hi: "पिगीबैक मार्ग" },
  logi_hub_and_spoke: { en: "Hub & spoke", hi: "हब और स्पोक" },
  logi_emergency_lateral: { en: "Emergency lateral", hi: "आपातकालीन पार्श्व" },
  logi_return_to_store: { en: "Return to store", hi: "भंडार वापसी" },

  // Escalation
  esc_none: { en: "Routine", hi: "नियमित" },
  esc_supervisor: { en: "Supervisor", hi: "पर्यवेक्षक" },
  esc_district_officer: { en: "District officer", hi: "जिला अधिकारी" },
  esc_emergency: { en: "Emergency", hi: "आपातकाल" },
  esc_label: { en: "Escalation", hi: "वृद्धि" },

  // Data confidence
  conf_label: { en: "Data confidence", hi: "डेटा विश्वास" },
  conf_high: { en: "High confidence", hi: "उच्च विश्वास" },
  conf_medium: { en: "Medium confidence", hi: "मध्यम विश्वास" },
  conf_low: { en: "Low confidence", hi: "कम विश्वास" },
  conf_very_low: { en: "Very low confidence", hi: "बहुत कम विश्वास" },

  // Statuses (workflow stages)
  status_awaiting_verification: { en: "Awaiting verification", hi: "सत्यापन प्रतीक्षारत" },
  status_awaiting_approval: { en: "Awaiting approval", hi: "स्वीकृति प्रतीक्षारत" },
  status_approved: { en: "Approved", hi: "स्वीकृत" },
  status_assigned: { en: "Assigned", hi: "आवंटित" },
  status_picked_up: { en: "Picked up", hi: "उठाया गया" },
  status_stock_updated: { en: "Stock updated", hi: "स्टॉक अपडेट" },
  status_rejected: { en: "Rejected", hi: "अस्वीकृत" },

  // Stepper short labels
  step_verify: { en: "Verify", hi: "सत्यापन" },
  step_approve: { en: "Approve", hi: "स्वीकृति" },
  step_approved: { en: "Approved", hi: "स्वीकृत" },
  step_assign: { en: "Assign", hi: "आवंटन" },
  step_pickup: { en: "Pickup", hi: "पिकअप" },
  step_update: { en: "Update", hi: "अपडेट" },

  // Actions
  act_verify_stock: { en: "Verify stock", hi: "स्टॉक सत्यापित करें" },
  act_mark_emergency: { en: "Mark emergency", hi: "आपातकाल चिह्नित करें" },
  act_request_reverify: { en: "Request re-verification", hi: "पुनः सत्यापन माँगें" },
  act_assign_logistics: { en: "Assign logistics", hi: "लॉजिस्टिक्स आवंटित करें" },
  act_confirm_pickup: { en: "Confirm pickup", hi: "पिकअप पुष्टि करें" },
  act_confirm_delivery: { en: "Confirm delivery", hi: "डिलीवरी पुष्टि करें" },
  act_view_timeline: { en: "View timeline", hi: "टाइमलाइन देखें" },
  act_hide_timeline: { en: "Hide timeline", hi: "टाइमलाइन छिपाएँ" },
  act_cancel: { en: "Cancel", hi: "रद्द करें" },
  act_confirm: { en: "Confirm", hi: "पुष्टि करें" },

  // Modals
  modal_verify_title: { en: "Verify physical stock", hi: "भौतिक स्टॉक सत्यापित करें" },
  modal_verify_qty: { en: "Physically verified quantity", hi: "भौतिक रूप से सत्यापित मात्रा" },
  modal_note: { en: "Note (optional)", hi: "टिप्पणी (वैकल्पिक)" },
  modal_approve_title: { en: "Approve transfer", hi: "स्थानांतरण स्वीकृत करें" },
  modal_approve_qty: { en: "Quantity to move (optional)", hi: "भेजने की मात्रा (वैकल्पिक)" },
  modal_modify_reason: { en: "Reason for change (optional)", hi: "परिवर्तन का कारण (वैकल्पिक)" },
  modal_reject_title: { en: "Reject recommendation", hi: "सिफारिश अस्वीकार करें" },
  modal_reject_reason: { en: "Reason for rejection (required)", hi: "अस्वीकृति का कारण (आवश्यक)" },
  modal_reject_required: { en: "A reason is required to reject.", hi: "अस्वीकार करने के लिए कारण आवश्यक है।" },
  modal_assign_title: { en: "Assign logistics", hi: "लॉजिस्टिक्स आवंटित करें" },
  modal_assign_model: { en: "Logistics model (optional)", hi: "लॉजिस्टिक्स मॉडल (वैकल्पिक)" },
  modal_confirm_delivery_title: { en: "Confirm delivery", hi: "डिलीवरी पुष्टि करें" },
  modal_received_qty: { en: "Received quantity", hi: "प्राप्त मात्रा" },
  modal_received_condition: { en: "Condition on arrival", hi: "पहुँचने पर स्थिति" },
  cond_good: { en: "Good", hi: "अच्छा" },
  cond_damaged: { en: "Damaged", hi: "क्षतिग्रस्त" },
  cond_partial: { en: "Partial", hi: "आंशिक" },

  // Audit summary
  audit_title: { en: "Final audit summary", hi: "अंतिम ऑडिट सारांश" },
  audit_verified_by: { en: "Verified by", hi: "सत्यापनकर्ता" },
  audit_approved_by: { en: "Approved by", hi: "स्वीकृतकर्ता" },
  audit_received: { en: "Received", hi: "प्राप्त" },
  audit_reject_reason: { en: "Rejection reason", hi: "अस्वीकृति कारण" },
  timeline_title: { en: "Audit trail", hi: "ऑडिट ट्रेल" },

  // Filter tab labels
  tab_all: { en: "All", hi: "सभी" },
  tab_awaiting_verification: { en: "Awaiting verification", hi: "सत्यापन प्रतीक्षारत" },
  tab_awaiting_approval: { en: "Awaiting approval", hi: "स्वीकृति प्रतीक्षारत" },
  tab_in_transit: { en: "Approved / In-transit", hi: "स्वीकृत / मार्ग में" },
  tab_completed: { en: "Completed", hi: "पूर्ण" },
  tab_rejected: { en: "Rejected", hi: "अस्वीकृत" },

  // Risk / urgency labels
  risk_healthy: { en: "Healthy", hi: "स्वस्थ" },
  risk_warning: { en: "Warning", hi: "चेतावनी" },
  risk_critical: { en: "Critical", hi: "गंभीर" },
  urgency_low: { en: "Low", hi: "कम" },
  urgency_medium: { en: "Medium", hi: "मध्यम" },
  urgency_high: { en: "High", hi: "उच्च" },
  urgency_critical: { en: "Critical", hi: "गंभीर" },

  // Alerts
  al_title: { en: "Alerts", hi: "अलर्ट" },
  al_subtitle: {
    en: "Urgent warnings that may need action.",
    hi: "जरूरी चेतावनियां जिन पर कार्रवाई की आवश्यकता हो सकती है।",
  },
  al_filter_type: { en: "Filter by type", hi: "प्रकार से फ़िल्टर" },
  al_all_types: { en: "All types", hi: "सभी प्रकार" },
  type_shortage: { en: "Shortage", hi: "कमी" },
  type_expiry: { en: "Expiry", hi: "समाप्ति" },
  type_spike: { en: "Demand spike", hi: "मांग उछाल" },
  type_transfer_due: { en: "Transfer due", hi: "स्थानांतरण देय" },
  type_bed_full: { en: "Beds full", hi: "बेड भरे" },
  type_doctor_absent: { en: "Doctor absent", hi: "डॉक्टर अनुपस्थित" },
  type_test_down: { en: "Test down", hi: "जांच बंद" },

  // Reports
  rp_title: { en: "Reports", hi: "रिपोर्ट" },
  rp_subtitle: {
    en: "Impact of AI-driven stock planning.",
    hi: "एआई-संचालित स्टॉक नियोजन का प्रभाव।",
  },
  rp_waste_avoided: { en: "Waste avoided", hi: "बर्बादी बचाई" },
  rp_waste_value: { en: "Value saved", hi: "मूल्य बचाया" },
  rp_stockouts_prevented: { en: "Stockouts prevented", hi: "स्टॉकआउट रोके" },
  rp_transfer_rate: { en: "Transfer completion", hi: "स्थानांतरण पूर्णता" },
  rp_acceptance_rate: { en: "Acceptance rate", hi: "स्वीकृति दर" },
  rp_top_medicines: { en: "Top risky medicines", hi: "सर्वाधिक जोखिम दवाएं" },
  rp_top_phcs: { en: "Top risky PHCs", hi: "सर्वाधिक जोखिम पीएचसी" },
  rp_trend: { en: "Stockouts & waste trend", hi: "स्टॉकआउट और बर्बादी रुझान" },
  rp_export_csv: { en: "Export CSV", hi: "CSV निर्यात" },
  rp_units: { en: "units", hi: "इकाई" },
  rp_stockouts: { en: "Stockouts", hi: "स्टॉकआउट" },
  rp_waste: { en: "Waste", hi: "बर्बादी" },

  // Beds
  bed_title: { en: "Bed availability", hi: "बेड उपलब्धता" },
  bed_subtitle: {
    en: "Occupancy across general, ICU and maternity.",
    hi: "जनरल, आईसीयू और मातृत्व में अधिभोग।",
  },
  bed_general: { en: "General", hi: "जनरल" },
  bed_icu: { en: "ICU", hi: "आईसीयू" },
  bed_maternity: { en: "Maternity", hi: "मातृत्व" },
  bed_occupancy: { en: "Occupancy", hi: "अधिभोग" },
  bed_available: { en: "available", hi: "उपलब्ध" },

  // Footfall
  ff_title: { en: "Patient footfall", hi: "मरीज़ आवक" },
  ff_subtitle: {
    en: "OPD, IPD and emergency load over time.",
    hi: "समय के साथ ओपीडी, आईपीडी और आपातकालीन भार।",
  },
  ff_opd: { en: "OPD", hi: "ओपीडी" },
  ff_ipd: { en: "IPD", hi: "आईपीडी" },
  ff_emergency: { en: "Emergency", hi: "आपातकालीन" },
  ff_total: { en: "Total", hi: "कुल" },
  ff_avg_daily: { en: "Avg daily", hi: "औसत दैनिक" },
  ff_peak_hour: { en: "Peak hour", hi: "व्यस्त घंटा" },
  ff_by_phc: { en: "By PHC", hi: "पीएचसी अनुसार" },
  ff_today: { en: "Today", hi: "आज" },

  // Doctors
  doc_title: { en: "Doctor attendance", hi: "डॉक्टर उपस्थिति" },
  doc_subtitle: {
    en: "Who is present, absent, or on leave.",
    hi: "कौन उपस्थित, अनुपस्थित या छुट्टी पर है।",
  },
  doc_present: { en: "Present", hi: "उपस्थित" },
  doc_absent: { en: "Absent", hi: "अनुपस्थित" },
  doc_on_leave: { en: "On leave", hi: "छुट्टी पर" },
  doc_expected: { en: "Expected", hi: "अपेक्षित" },
  doc_attendance_rate: { en: "Attendance rate", hi: "उपस्थिति दर" },
  doc_specialty: { en: "Specialty", hi: "विशेषज्ञता" },
  doc_name: { en: "Doctor", hi: "डॉक्टर" },

  // Tests
  test_title: { en: "Test availability", hi: "जांच उपलब्धता" },
  test_subtitle: {
    en: "Diagnostic tests currently up or down.",
    hi: "वर्तमान में उपलब्ध या बंद नैदानिक जांच।",
  },
  test_available: { en: "Available", hi: "उपलब्ध" },
  test_unavailable: { en: "Unavailable", hi: "अनुपलब्ध" },
  test_reason: { en: "Reason", hi: "कारण" },
  test_name: { en: "Test", hi: "जांच" },
  test_category: { en: "Category", hi: "श्रेणी" },

  // District
  dist_title: { en: "District intelligence", hi: "जिला इंटेलिजेंस" },
  dist_subtitle: {
    en: "Per-PHC health scores with flagged centres for intervention.",
    hi: "हस्तक्षेप हेतु चिह्नित केंद्रों के साथ प्रति-पीएचसी स्वास्थ्य स्कोर।",
  },
  dist_health_score: { en: "Health score", hi: "स्वास्थ्य स्कोर" },
  dist_avg_score: { en: "Avg health score", hi: "औसत स्वास्थ्य स्कोर" },
  dist_total_phcs: { en: "Total PHCs", hi: "कुल पीएचसी" },
  dist_critical_phcs: { en: "Critical PHCs", hi: "गंभीर पीएचसी" },
  dist_flagged: { en: "Flagged", hi: "चिह्नित" },
  dist_flagged_centres: { en: "Flagged for intervention", hi: "हस्तक्षेप हेतु चिह्नित" },
  dist_flag_reason: { en: "Flag reason", hi: "चिह्न कारण" },
  dist_stock_risk: { en: "Stock risk", hi: "स्टॉक जोखिम" },
  dist_bed_pressure: { en: "Bed pressure", hi: "बेड दबाव" },
  dist_doctor_gap: { en: "Doctor gap", hi: "डॉक्टर कमी" },
  dist_test_gap: { en: "Test gap", hi: "जांच कमी" },
  dist_map_view: { en: "Map view", hi: "मानचित्र दृश्य" },
  dist_table_view: { en: "Table view", hi: "तालिका दृश्य" },

  // Facility map (Google Maps Embed)
  map_title: { en: "Facility map", hi: "केंद्र मानचित्र" },
  map_subtitle: {
    en: "Live Google Maps location of each PHC/CHC, colour-coded by risk.",
    hi: "प्रत्येक पीएचसी/सीएचसी का लाइव Google मानचित्र स्थान, जोखिम अनुसार रंग-कोडित।",
  },
  map_facilities: { en: "Facilities", hi: "केंद्र" },
  map_search_placeholder: { en: "Search a centre…", hi: "केंद्र खोजें…" },
  map_open_in_gmaps: { en: "Open in Google Maps", hi: "Google मानचित्र में खोलें" },
  map_key_missing_title: { en: "Add a Google Maps key to embed the live map", hi: "लाइव मानचित्र एम्बेड करने के लिए Google मानचित्र कुंजी जोड़ें" },
  map_key_missing_body: {
    en: "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Maps Embed API — free, no billing) in frontend/.env.local. Until then, use the buttons below to open each centre in Google Maps.",
    hi: "frontend/.env.local में NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Maps Embed API — निःशुल्क) सेट करें। तब तक, प्रत्येक केंद्र को Google मानचित्र में खोलने के लिए नीचे दिए बटन का उपयोग करें।",
  },
  map_no_results: { en: "No centres match your search.", hi: "आपकी खोज से कोई केंद्र मेल नहीं खाता।" },

  // States
  state_loading: { en: "Loading…", hi: "लोड हो रहा है…" },
  state_empty_title: { en: "Nothing to show", hi: "दिखाने के लिए कुछ नहीं" },
  state_empty_healthy: {
    en: "Nothing urgent today. Stock levels are healthy.",
    hi: "आज कुछ जरूरी नहीं। स्टॉक स्तर स्वस्थ हैं।",
  },
  state_error_title: { en: "Something went wrong", hi: "कुछ गलत हुआ" },
  state_error_body: {
    en: "We could not load this data. Showing the latest available snapshot.",
    hi: "हम यह डेटा लोड नहीं कर सके। नवीनतम उपलब्ध स्नैपशॉट दिखा रहे हैं।",
  },
  retry: { en: "Retry", hi: "पुनः प्रयास" },
  offline_banner: {
    en: "Live backend unreachable — showing demo data.",
    hi: "लाइव बैकएंड अनुपलब्ध — डेमो डेटा दिखा रहे हैं।",
  },

  // Ingest / stock update
  ing_title: { en: "Stock update", hi: "स्टॉक अपडेट" },
  ing_subtitle: {
    en: "Low-connectivity fallbacks to keep stock data fresh — even without the app.",
    hi: "स्टॉक डेटा ताज़ा रखने के लिए कम-कनेक्टिविटी फॉलबैक — ऐप के बिना भी।",
  },
  ing_sms_title: { en: "SMS stock report", hi: "एसएमएस स्टॉक रिपोर्ट" },
  ing_sms_desc: {
    en: "Field staff without a smartphone can text stock in a simple format. Records are marked low-confidence and flagged for verification.",
    hi: "बिना स्मार्टफोन वाले फील्ड स्टाफ सरल प्रारूप में स्टॉक भेज सकते हैं। रिकॉर्ड कम-विश्वास चिह्नित और सत्यापन हेतु फ़्लैग किए जाते हैं।",
  },
  ing_sms_input: { en: "SMS message", hi: "एसएमएस संदेश" },
  ing_sms_send: { en: "Send SMS", hi: "एसएमएस भेजें" },
  ing_sms_formats: { en: "Accepted formats", hi: "स्वीकृत प्रारूप" },
  ing_sms_result: { en: "Parsed stock update", hi: "पार्स किया स्टॉक अपडेट" },
  ing_csv_title: { en: "CSV bulk upload", hi: "सीएसवी बल्क अपलोड" },
  ing_csv_desc: {
    en: "Facilities with periodic connectivity can upload a stock snapshot as CSV.",
    hi: "आवधिक कनेक्टिविटी वाली सुविधाएँ स्टॉक स्नैपशॉट सीएसवी के रूप में अपलोड कर सकती हैं।",
  },
  ing_csv_input: { en: "CSV data", hi: "सीएसवी डेटा" },
  ing_csv_upload: { en: "Upload", hi: "अपलोड करें" },
  ing_csv_inserted: { en: "rows inserted", hi: "पंक्तियाँ जोड़ी गईं" },
  ing_csv_errors: { en: "row errors", hi: "पंक्ति त्रुटियाँ" },
  ing_field_qty: { en: "Quantity", hi: "मात्रा" },
  ing_field_batch: { en: "Batch", hi: "बैच" },
  ing_field_expiry: { en: "Expiry", hi: "समाप्ति" },
  ing_field_medicine: { en: "Medicine", hi: "दवा" },
  ing_field_phc: { en: "PHC", hi: "पीएचसी" },
  ing_tiers_title: { en: "Digital maturity tiers", hi: "डिजिटल परिपक्वता स्तर" },
  ing_tiers_desc: {
    en: "The system meets each facility where it is — from full app to a basic SMS.",
    hi: "सिस्टम प्रत्येक सुविधा को उसकी स्थिति के अनुसार सहारा देता है — पूर्ण ऐप से बुनियादी एसएमएस तक।",
  },
  ing_tier_app: { en: "App / barcode", hi: "ऐप / बारकोड" },
  ing_tier_app_desc: {
    en: "Real-time sync, barcode scans — high confidence.",
    hi: "रीयल-टाइम सिंक, बारकोड स्कैन — उच्च विश्वास।",
  },
  ing_tier_smartphone: { en: "Smartphone", hi: "स्मार्टफोन" },
  ing_tier_smartphone_desc: {
    en: "Periodic app or CSV entry — medium confidence.",
    hi: "आवधिक ऐप या सीएसवी प्रविष्टि — मध्यम विश्वास।",
  },
  ing_tier_sms: { en: "SMS / feature phone", hi: "एसएमएस / फीचर फोन" },
  ing_tier_sms_desc: {
    en: "Text-message stock reports — low confidence, verify on site.",
    hi: "टेक्स्ट-संदेश स्टॉक रिपोर्ट — कम विश्वास, मौके पर सत्यापित करें।",
  },

  // AI assistant — "Ask the District"
  nav_assistant: { en: "Ask the District", hi: "जिले से पूछें" },
  asst_title: { en: "Ask the District", hi: "जिले से पूछें" },
  asst_subtitle: {
    en: "Ask a plain-language question about stock, centres and transfers. Answers are grounded on live district data.",
    hi: "स्टॉक, केंद्रों और स्थानांतरण के बारे में सरल भाषा में प्रश्न पूछें। उत्तर लाइव जिला डेटा पर आधारित हैं।",
  },
  asst_input_placeholder: {
    en: "e.g. Which centres run out of insulin this week?",
    hi: "उदा. इस सप्ताह किन केंद्रों में इंसुलिन खत्म हो जाएगी?",
  },
  asst_send: { en: "Ask", hi: "पूछें" },
  asst_thinking: { en: "Thinking…", hi: "सोच रहे हैं…" },
  asst_examples: { en: "Try an example", hi: "एक उदाहरण आज़माएँ" },
  asst_empty_title: { en: "Ask your first question", hi: "अपना पहला प्रश्न पूछें" },
  asst_empty_body: {
    en: "Type a question above or pick an example to get a grounded answer.",
    hi: "ऊपर प्रश्न लिखें या आधारित उत्तर पाने के लिए एक उदाहरण चुनें।",
  },
  asst_you: { en: "You", hi: "आप" },
  asst_grounded_on: { en: "Grounded on", hi: "आधारित" },
  asst_g_flagged: { en: "flagged centres", hi: "चिह्नित केंद्र" },
  asst_g_critical: { en: "critical items", hi: "गंभीर वस्तुएं" },
  asst_g_transfers: { en: "open transfers", hi: "लंबित स्थानांतरण" },
  asst_ex_1: {
    en: "Which centres run out of insulin this week?",
    hi: "इस सप्ताह किन केंद्रों में इंसुलिन खत्म हो जाएगी?",
  },
  asst_ex_2: {
    en: "Where is bed pressure highest right now?",
    hi: "अभी बेड दबाव कहाँ सबसे अधिक है?",
  },
  asst_ex_3: {
    en: "Which stock transfers need approval?",
    hi: "किन स्टॉक स्थानांतरणों को स्वीकृति चाहिए?",
  },
  asst_ex_4: {
    en: "Summarise the district's biggest risks today.",
    hi: "आज जिले के सबसे बड़े जोखिमों का सारांश दें।",
  },

  // AI source badges + status
  ai_source_gemini: { en: "Gemini", hi: "जेमिनी" },
  ai_source_fallback: { en: "Offline fallback", hi: "ऑफ़लाइन फॉलबैक" },
  ai_status_live: { en: "AI: Gemini live", hi: "एआई: जेमिनी लाइव" },
  ai_status_offline: { en: "AI: offline mode", hi: "एआई: ऑफ़लाइन मोड" },

  // AI briefing on recommendation cards
  ai_briefing: { en: "AI briefing", hi: "एआई ब्रीफिंग" },
  ai_briefing_hide: { en: "Hide briefing", hi: "ब्रीफिंग छिपाएँ" },

  // Google sign-in (Firebase)
  auth_sign_in_google: { en: "Sign in with Google", hi: "Google से साइन इन करें" },
  auth_sign_out: { en: "Sign out", hi: "साइन आउट" },
  auth_demo_user: { en: "Demo Supervisor", hi: "डेमो पर्यवेक्षक" },
  auth_signing_in: { en: "Signing in…", hi: "साइन इन हो रहा है…" },

  // Common
  view_all: { en: "View all", hi: "सभी देखें" },
  updated: { en: "Updated", hi: "अद्यतन" },
  of: { en: "of", hi: "में से" },
  search: { en: "Search", hi: "खोजें" },
} as const;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  const entry = dict[key];
  if (!entry) return String(key);
  return entry[lang] ?? entry.en;
}
