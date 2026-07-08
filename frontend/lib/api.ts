import type {
  Alert,
  AlertType,
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
  LogisticsModel,
  Medicine,
  Phc,
  ReceivedCondition,
  Recommendation,
  RecommendationBriefing,
  RecommendationStatusFilter,
  ReportSummary,
  RiskLevel,
  SmsIngestResult,
  TestRecord,
  TimelineEvent,
  TransferType,
} from "./types";
import {
  mockAlerts,
  mockAssistantAnswer,
  mockAssistantStatus,
  mockBeds,
  mockCsvIngest,
  mockDashboard,
  mockDistrict,
  mockDoctors,
  mockDoctorSummary,
  mockFootfall,
  mockForecast,
  mockForecastMetrics,
  mockInventory,
  mockMedicines,
  mockPhcs,
  mockRecommendationBriefing,
  mockRecommendations,
  mockReport,
  mockSmsIngest,
  mockTests,
  mockTimeline,
} from "./mock";

// Bodies for the human-in-the-loop state-machine transitions.
export interface VerifyBody { verified_by: string; confirmed_qty?: number; note?: string }
export interface RequestVerificationBody { actor: string }
export interface ApproveBody { approved_by: string; actual_qty?: number; modify_reason?: string }
export interface RejectBody { rejected_by: string; reason: string }
export interface AssignBody { actor: string; logistics_model?: LogisticsModel }
export interface PickupBody { pickup_by: string }
export interface ConfirmBody { received_by: string; received_qty?: number; received_condition: ReceivedCondition }
export interface MarkEmergencyBody { actor: string }

// Terminal / non-terminal helper for the "open" filter in mock fallback.
const OPEN_STATUSES = new Set([
  "awaiting_verification",
  "awaiting_approval",
  "approved",
  "assigned",
  "picked_up",
]);

function nowISO(): string {
  return new Date().toISOString();
}

/** Optimistically apply a transition to a mock recommendation for offline demos. */
function mockPatch(id: string, patch: Partial<Recommendation>): Recommendation {
  const rec = mockRecommendations.find((r) => r.recommendation_id === id);
  const base =
    rec ?? (mockRecommendations[0] as Recommendation);
  return { ...base, ...patch };
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

// Tracks whether the last request fell back to mock data, so the UI can show
// a small "demo data" banner. Consumers read `usingMockData` from api results.
export interface ApiResult<T> {
  data: T;
  fromMock: boolean;
}

function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Core fetch wrapper. Attempts the live backend; on any failure (network error,
 * non-2xx, timeout) it logs a small warning and returns the provided mock value
 * so every page still renders during a live demo.
 */
async function request<T>(
  path: string,
  fallback: () => T,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const url = `${API_BASE}/api${path}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    return { data, fromMock: false };
  } catch (err) {
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.warn(
        `[api] falling back to mock for ${path} (${(err as Error)?.message ?? "error"})`,
      );
    }
    return { data: fallback(), fromMock: true };
  }
}

// ---- Master data -----------------------------------------------------------

export const api = {
  getPhcs: () => request<Phc[]>("/phcs", () => mockPhcs),

  getMedicines: () => request<Medicine[]>("/medicines", () => mockMedicines),

  getDashboard: (phcId: string | null, lang: Lang) =>
    request<DashboardSummary>(
      `/dashboard/summary${qs({ phc_id: phcId, lang })}`,
      () => mockDashboard,
    ),

  getInventory: (opts: {
    phc_id?: string | null;
    medicine_id?: string | null;
    risk_level?: RiskLevel | null;
  }) =>
    request<InventoryItem[]>(
      `/inventory${qs({ phc_id: opts.phc_id, medicine_id: opts.medicine_id, risk_level: opts.risk_level })}`,
      () =>
        mockInventory.filter(
          (r) =>
            (!opts.phc_id || r.phc_id === opts.phc_id) &&
            (!opts.medicine_id || r.medicine_id === opts.medicine_id) &&
            (!opts.risk_level || r.risk_level === opts.risk_level),
        ),
    ),

  getForecast: (phcId: string, medicineId: string, horizon = 14) =>
    request<Forecast>(
      `/forecast${qs({ phc_id: phcId, medicine_id: medicineId, horizon })}`,
      () => mockForecast(phcId, medicineId),
    ),

  getForecastMetrics: () =>
    request<ForecastMetrics>("/forecast/metrics", () => mockForecastMetrics),

  getRecommendations: (opts: {
    status?: RecommendationStatusFilter | null;
    phc_id?: string | null;
    transfer_type?: TransferType | null;
    lang?: Lang;
  }) =>
    request<Recommendation[]>(
      `/recommendations${qs({ status: opts.status, phc_id: opts.phc_id, transfer_type: opts.transfer_type, lang: opts.lang })}`,
      () =>
        mockRecommendations.filter(
          (r) =>
            (!opts.status ||
              (opts.status === "open"
                ? OPEN_STATUSES.has(r.status)
                : r.status === opts.status)) &&
            (!opts.transfer_type || r.transfer_type === opts.transfer_type) &&
            (!opts.phc_id ||
              r.source_phc_id === opts.phc_id ||
              r.target_phc_id === opts.phc_id),
        ),
    ),

  generateRecommendations: (body: { phc_id: string | null }) =>
    request<Recommendation[]>(
      "/recommendations/generate",
      () => mockRecommendations.slice(),
      { method: "POST", body: JSON.stringify(body) },
    ),

  getRecommendationTimeline: (id: string) =>
    request<TimelineEvent[]>(
      `/recommendations/${id}/timeline`,
      () => mockTimeline(id),
    ),

  verifyRecommendation: (id: string, body: VerifyBody) =>
    request<Recommendation>(
      `/recommendations/${id}/verify`,
      () =>
        mockPatch(id, {
          status: "awaiting_approval",
          verified_by: body.verified_by,
          verified_at: nowISO(),
          verified_qty: body.confirmed_qty ?? null,
        }),
      { method: "POST", body: JSON.stringify(body) },
    ),

  requestVerification: (id: string, body: RequestVerificationBody) =>
    request<Recommendation>(
      `/recommendations/${id}/request-verification`,
      () => mockPatch(id, { status: "awaiting_verification" }),
      { method: "POST", body: JSON.stringify(body) },
    ),

  approveRecommendation: (id: string, body: ApproveBody) =>
    request<Recommendation>(
      `/recommendations/${id}/approve`,
      () =>
        mockPatch(id, {
          status: "approved",
          approved_by: body.approved_by,
          approved_at: nowISO(),
          actual_qty: body.actual_qty ?? null,
          modify_reason: body.modify_reason ?? null,
        }),
      { method: "POST", body: JSON.stringify(body) },
    ),

  rejectRecommendation: (id: string, body: RejectBody) =>
    request<Recommendation>(
      `/recommendations/${id}/reject`,
      () =>
        mockPatch(id, {
          status: "rejected",
          reject_reason: body.reason,
        }),
      { method: "POST", body: JSON.stringify(body) },
    ),

  assignRecommendation: (id: string, body: AssignBody) =>
    request<Recommendation>(
      `/recommendations/${id}/assign`,
      () =>
        mockPatch(id, {
          status: "assigned",
          assigned_at: nowISO(),
          ...(body.logistics_model ? { logistics_model: body.logistics_model } : {}),
        }),
      { method: "POST", body: JSON.stringify(body) },
    ),

  pickupRecommendation: (id: string, body: PickupBody) =>
    request<Recommendation>(
      `/recommendations/${id}/pickup`,
      () =>
        mockPatch(id, {
          status: "picked_up",
          pickup_by: body.pickup_by,
          picked_up_at: nowISO(),
        }),
      { method: "POST", body: JSON.stringify(body) },
    ),

  confirmRecommendation: (id: string, body: ConfirmBody) =>
    request<Recommendation>(
      `/recommendations/${id}/confirm`,
      () => {
        const ts = nowISO();
        return mockPatch(id, {
          status: "stock_updated",
          received_qty: body.received_qty ?? null,
          received_condition: body.received_condition,
          delivered_at: ts,
          stock_updated_at: ts,
        });
      },
      { method: "POST", body: JSON.stringify(body) },
    ),

  markEmergency: (id: string, body: MarkEmergencyBody) =>
    request<Recommendation>(
      `/recommendations/${id}/mark-emergency`,
      () =>
        mockPatch(id, {
          emergency: true,
          escalation_level: "emergency",
          logistics_model: "emergency_lateral",
          urgency: "critical",
        }),
      { method: "POST", body: JSON.stringify(body) },
    ),

  ingestSms: (body: { message: string; phc_id?: string | null }) =>
    request<SmsIngestResult>(
      "/ingest/sms",
      () => mockSmsIngest(body.message),
      { method: "POST", body: JSON.stringify(body) },
    ),

  ingestCsv: (body: { csv: string }) =>
    request<CsvIngestResult>(
      "/ingest/csv",
      () => mockCsvIngest(body.csv),
      { method: "POST", body: JSON.stringify(body) },
    ),

  getAlerts: (opts: { phc_id?: string | null; type?: AlertType | null; lang?: Lang }) =>
    request<Alert[]>(
      `/alerts${qs({ phc_id: opts.phc_id, type: opts.type, lang: opts.lang })}`,
      () =>
        mockAlerts.filter(
          (a) =>
            (!opts.phc_id || a.phc_id === opts.phc_id) &&
            (!opts.type || a.type === opts.type),
        ),
    ),

  getReport: (lang: Lang) =>
    request<ReportSummary>(`/reports/summary${qs({ lang })}`, () => mockReport),

  getBeds: (phcId: string | null) =>
    request<BedRecord[]>(
      `/beds${qs({ phc_id: phcId })}`,
      () => (phcId ? mockBeds.filter((b) => b.phc_id === phcId) : mockBeds),
    ),

  getFootfall: (phcId: string | null, days = 14) =>
    request<Footfall>(`/footfall${qs({ phc_id: phcId, days })}`, () => mockFootfall(phcId)),

  getDoctors: (phcId: string | null) =>
    request<Doctor[]>(
      `/doctors${qs({ phc_id: phcId })}`,
      () => (phcId ? mockDoctors.filter((d) => d.phc_id === phcId) : mockDoctors),
    ),

  getDoctorSummary: (phcId: string | null) =>
    request<DoctorSummary>(`/doctors/summary${qs({ phc_id: phcId })}`, () =>
      mockDoctorSummary(),
    ),

  getTests: (opts: { phc_id?: string | null; available?: boolean | null; lang?: Lang }) =>
    request<TestRecord[]>(
      `/tests${qs({ phc_id: opts.phc_id, available: opts.available, lang: opts.lang })}`,
      () =>
        mockTests.filter(
          (tst) =>
            (!opts.phc_id || tst.phc_id === opts.phc_id) &&
            (opts.available === undefined ||
              opts.available === null ||
              tst.available === opts.available),
        ),
    ),

  getDistrict: (lang: Lang) =>
    request<DistrictOverview>(`/district/overview${qs({ lang })}`, () => mockDistrict),

  // ---- AI assistant (Gemini) ----------------------------------------------

  getAssistantStatus: () =>
    request<AssistantStatus>("/assistant/status", () => mockAssistantStatus),

  askAssistant: (question: string, lang: Lang) =>
    request<AssistantAnswer>(
      "/assistant/ask",
      () => mockAssistantAnswer(question, lang),
      { method: "POST", body: JSON.stringify({ question, lang }) },
    ),

  getRecommendationBriefing: (id: string) =>
    request<RecommendationBriefing>(
      `/recommendations/${id}/briefing`,
      () => mockRecommendationBriefing(id),
    ),
};
