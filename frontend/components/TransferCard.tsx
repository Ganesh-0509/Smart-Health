"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  ArrowRight,
  Check,
  X,
  Pill,
  Gauge,
  Loader2,
  Truck,
  Warehouse,
  Siren,
  Undo2,
  Snowflake,
  ShieldAlert,
  ShieldCheck,
  CalendarClock,
  Package,
  MapPin,
  Building2,
  ClipboardCheck,
  History,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  EscalationLevel,
  LogisticsModel,
  ReceivedCondition,
  Recommendation,
  RecommendationBriefing,
  RecommendationStatus,
  TimelineEvent,
} from "@/lib/types";
import { useApp, pickLang } from "@/lib/context";
import { api } from "@/lib/api";
import { UrgencyBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";
import { AiSourceBadge } from "./AiBadges";
import { Modal } from "./Modal";
import { StatusStepper } from "./StatusStepper";
import { confidenceSemantic, shortDate, type Semantic } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";

export interface TransferActions {
  onVerify: (id: string, body: { confirmed_qty?: number; note?: string }) => void;
  onRequestVerification: (id: string) => void;
  onApprove: (id: string, body: { actual_qty?: number; modify_reason?: string }) => void;
  onReject: (id: string, reason: string) => void;
  onAssign: (id: string, logistics_model?: LogisticsModel) => void;
  onPickup: (id: string) => void;
  onConfirm: (id: string, body: { received_qty?: number; received_condition: ReceivedCondition }) => void;
  onMarkEmergency: (id: string) => void;
  onTimeline: (id: string) => Promise<TimelineEvent[]>;
}

const statusMeta: Record<RecommendationStatus, { semantic: Semantic; icon?: "pending" | "rejected" | "none" }> = {
  awaiting_verification: { semantic: "warning", icon: "pending" },
  awaiting_approval: { semantic: "info", icon: "pending" },
  approved: { semantic: "healthy" },
  assigned: { semantic: "info", icon: "none" },
  picked_up: { semantic: "info", icon: "none" },
  stock_updated: { semantic: "healthy" },
  rejected: { semantic: "critical", icon: "rejected" },
};

const logisticsIcon: Record<LogisticsModel, LucideIcon> = {
  piggyback: Truck,
  hub_and_spoke: Warehouse,
  emergency_lateral: Siren,
  return_to_store: Undo2,
};
const logisticsKey: Record<LogisticsModel, DictKey> = {
  piggyback: "logi_piggyback",
  hub_and_spoke: "logi_hub_and_spoke",
  emergency_lateral: "logi_emergency_lateral",
  return_to_store: "logi_return_to_store",
};

const escalationMeta: Record<EscalationLevel, { semantic: Semantic; key: DictKey; pulse?: boolean }> = {
  none: { semantic: "info", key: "esc_none" },
  supervisor: { semantic: "info", key: "esc_supervisor" },
  district_officer: { semantic: "warning", key: "esc_district_officer" },
  emergency: { semantic: "critical", key: "esc_emergency", pulse: true },
};

const semanticChip: Record<Semantic, string> = {
  healthy: "bg-healthy-bg text-healthy-text border-healthy-border",
  warning: "bg-warning-bg text-warning-text border-warning-border",
  critical: "bg-critical-bg text-critical-text border-critical-border",
  info: "bg-info-bg text-info-text border-info-border",
};

function Chip({
  semantic = "info",
  icon: Icon,
  children,
  pulse,
}: {
  semantic?: Semantic;
  icon?: LucideIcon;
  children: React.ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        semanticChip[semantic],
        pulse && "animate-pulse",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {children}
    </span>
  );
}

type ModalKind = "verify" | "approve" | "reject" | "assign" | "confirm" | null;

export function TransferCard({
  rec,
  busy,
  actions,
}: {
  rec: Recommendation;
  busy?: boolean;
  actions: TransferActions;
}) {
  const { t, lang } = useApp();
  const reason = pickLang(rec, "reason", lang);
  const benefit = pickLang(rec, "expected_benefit", lang);
  const confReason = pickLang(rec, "confidence_reason", lang);

  const [modal, setModal] = useState<ModalKind>(null);
  const [verifyQty, setVerifyQty] = useState(rec.suggested_qty);
  const [verifyNote, setVerifyNote] = useState("");
  const [approveQty, setApproveQty] = useState(rec.verified_qty ?? rec.suggested_qty);
  const [modifyReason, setModifyReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectErr, setRejectErr] = useState(false);
  const [assignModel, setAssignModel] = useState<LogisticsModel | "">("");
  const [receivedQty, setReceivedQty] = useState(rec.actual_qty ?? rec.suggested_qty);
  const [condition, setCondition] = useState<ReceivedCondition>("good");

  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [briefing, setBriefing] = useState<RecommendationBriefing | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const isReturn = rec.transfer_type === "return_to_store";
  const isTerminal = rec.status === "stock_updated" || rec.status === "rejected";
  const sm = statusMeta[rec.status];
  const conf = confidenceSemantic(rec.confidence);
  const esc = escalationMeta[rec.escalation_level];
  const LogiIcon = logisticsIcon[rec.logistics_model];

  async function toggleTimeline() {
    if (showTimeline) {
      setShowTimeline(false);
      return;
    }
    setShowTimeline(true);
    if (!timeline) {
      setLoadingTimeline(true);
      try {
        setTimeline(await actions.onTimeline(rec.recommendation_id));
      } finally {
        setLoadingTimeline(false);
      }
    }
  }

  async function toggleBriefing() {
    if (showBriefing) {
      setShowBriefing(false);
      return;
    }
    setShowBriefing(true);
    if (!briefing) {
      setLoadingBriefing(true);
      try {
        const res = await api.getRecommendationBriefing(rec.recommendation_id);
        setBriefing(res.data);
      } finally {
        setLoadingBriefing(false);
      }
    }
  }

  function close() {
    setModal(null);
    setRejectErr(false);
  }

  return (
    <div
      className={clsx(
        "card flex flex-col gap-4 p-5 transition-shadow hover:shadow-card-hover",
        isTerminal && "opacity-95",
        rec.emergency && "ring-1 ring-critical-border",
      )}
    >
      {/* Header: medicine + urgency/status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Pill className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <span className="truncate">{rec.medicine_name}</span>
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">{rec.recommendation_id}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <UrgencyBadge urgency={rec.urgency} size="sm" />
          <StatusBadge semantic={sm.semantic} label={t(`status_${rec.status}` as DictKey)} icon={sm.icon} size="sm" />
        </div>
      </div>

      {/* Route */}
      <div
        className={clsx(
          "flex items-center gap-2 rounded-xl p-3 text-sm",
          isReturn ? "bg-info-bg" : "bg-surface-soft",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-muted">{t("rec_from")}</p>
          <p className="truncate font-medium text-ink">{rec.source_phc_name}</p>
        </div>
        <div className="flex flex-col items-center px-2 text-brand-600">
          <span className="text-xs font-bold tabular-nums">
            {rec.suggested_qty} {rec.unit}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-xs text-ink-muted">{t("rec_to")}</p>
          <p className="flex items-center justify-end gap-1 truncate font-medium text-ink">
            {isReturn ? <Building2 className="h-3.5 w-3.5 shrink-0 text-info-text" aria-hidden /> : null}
            {isReturn ? t("rec_return_store") : rec.target_phc_name}
          </p>
        </div>
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip
          semantic={isReturn ? "info" : "healthy"}
          icon={isReturn ? Undo2 : Package}
        >
          {t(isReturn ? "transfer_return_to_store" : "transfer_redistribution")}
        </Chip>
        <Chip icon={LogiIcon}>{t(logisticsKey[rec.logistics_model])}</Chip>
        <Chip semantic={esc.semantic} icon={rec.emergency ? Siren : esc.semantic === "info" ? ShieldCheck : ShieldAlert} pulse={esc.pulse}>
          {t("esc_label")}: {t(esc.key)}
        </Chip>
        {rec.cold_chain ? (
          <Chip semantic="info" icon={Snowflake}>
            {t("rec_cold_chain")}
          </Chip>
        ) : null}
      </div>

      {/* Data confidence */}
      <div
        className={clsx(
          "rounded-lg border px-3 py-2 text-xs",
          semanticChip[conf],
        )}
      >
        <div className="flex items-center gap-1.5 font-semibold">
          {conf === "healthy" ? (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("conf_label")}: {t(`conf_${rec.confidence}` as DictKey)}
        </div>
        {confReason ? <p className="mt-1 opacity-90">{confReason}</p> : null}
        {rec.confidence !== "high" && !isTerminal ? (
          <p className="mt-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {t("rec_verify_hint")}
          </p>
        ) : null}
      </div>

      {/* Reason + benefit */}
      <p className="text-sm text-ink-soft">{reason}</p>
      {benefit ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-healthy-text">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {benefit}
        </p>
      ) : null}

      {/* Clinical / logistics meta */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <Package className="h-3.5 w-3.5" aria-hidden />
          {t("rec_batch")}: <span className="font-medium text-ink-soft">{rec.batch_no}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {t("rec_expiry")}: <span className="font-medium text-ink-soft">{shortDate(rec.expiry_date, lang)}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {rec.distance_km.toFixed(1)} km
        </span>
        <span className="inline-flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" aria-hidden />
          {t("rec_priority")}: {(rec.priority_score * 100).toFixed(0)}
        </span>
        {rec.predicted_stockout_date ? (
          <span className="inline-flex items-center gap-1 text-critical-text">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {t("rec_stockout_by")}: {shortDate(rec.predicted_stockout_date, lang)}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t("rec_buffer_after").replace("{n}", String(Math.round(rec.source_buffer_days_after)))}
        </span>
      </div>

      {/* Stepper */}
      <div className="border-t border-slate-100 pt-4">
        <StatusStepper status={rec.status} />
      </div>

      {/* Terminal audit summary */}
      {isTerminal ? (
        <div className="rounded-lg bg-surface-soft px-3 py-2.5 text-xs text-ink-soft">
          <p className="mb-1 font-semibold text-ink">{t("audit_title")}</p>
          {rec.status === "rejected" ? (
            <p>
              <span className="font-medium">{t("audit_reject_reason")}:</span> {rec.reject_reason}
            </p>
          ) : (
            <div className="space-y-0.5">
              {rec.verified_by ? (
                <p>
                  {t("audit_verified_by")}: <span className="font-medium">{rec.verified_by}</span> ({rec.verified_qty ?? rec.suggested_qty} {rec.unit})
                </p>
              ) : null}
              {rec.approved_by ? (
                <p>
                  {t("audit_approved_by")}: <span className="font-medium">{rec.approved_by}</span> ({rec.actual_qty ?? rec.suggested_qty} {rec.unit})
                </p>
              ) : null}
              {rec.received_qty != null ? (
                <p>
                  {t("audit_received")}: <span className="font-medium">{rec.received_qty} {rec.unit}</span> — {t(`cond_${rec.received_condition ?? "good"}` as DictKey)}
                </p>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {rec.status === "awaiting_verification" ? (
          <>
            <button onClick={() => setModal("verify")} disabled={busy} className={btnPrimary}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ClipboardCheck className="h-4 w-4" aria-hidden />}
              {t("act_verify_stock")}
            </button>
            <button onClick={() => setModal("reject")} disabled={busy} className={btnDanger}>
              <X className="h-4 w-4" aria-hidden />
              {t("rec_reject")}
            </button>
            {!rec.emergency ? (
              <button onClick={() => actions.onMarkEmergency(rec.recommendation_id)} disabled={busy} className={btnGhost}>
                <Siren className="h-4 w-4" aria-hidden />
                {t("act_mark_emergency")}
              </button>
            ) : null}
          </>
        ) : null}

        {rec.status === "awaiting_approval" ? (
          <>
            <button onClick={() => setModal("approve")} disabled={busy} className={btnPrimary}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
              {t("rec_approve")}
            </button>
            <button onClick={() => setModal("reject")} disabled={busy} className={btnDanger}>
              <X className="h-4 w-4" aria-hidden />
              {t("rec_reject")}
            </button>
            <button onClick={() => actions.onRequestVerification(rec.recommendation_id)} disabled={busy} className={btnGhost}>
              <Undo2 className="h-4 w-4" aria-hidden />
              {t("act_request_reverify")}
            </button>
          </>
        ) : null}

        {rec.status === "approved" ? (
          <button onClick={() => setModal("assign")} disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Truck className="h-4 w-4" aria-hidden />}
            {t("act_assign_logistics")}
          </button>
        ) : null}

        {rec.status === "assigned" ? (
          <button onClick={() => actions.onPickup(rec.recommendation_id)} disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Package className="h-4 w-4" aria-hidden />}
            {t("act_confirm_pickup")}
          </button>
        ) : null}

        {rec.status === "picked_up" ? (
          <button onClick={() => setModal("confirm")} disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ClipboardCheck className="h-4 w-4" aria-hidden />}
            {t("act_confirm_delivery")}
          </button>
        ) : null}

        <button onClick={toggleBriefing} className={clsx(btnGhost, "ml-auto")}>
          <Sparkles className="h-4 w-4 text-brand-600" aria-hidden />
          {showBriefing ? t("ai_briefing_hide") : t("ai_briefing")}
        </button>
        <button onClick={toggleTimeline} className={btnGhost}>
          <History className="h-4 w-4" aria-hidden />
          {showTimeline ? t("act_hide_timeline") : t("act_view_timeline")}
        </button>
      </div>

      {/* AI briefing */}
      {showBriefing ? (
        <div className="rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-3">
          <div className="mb-1.5 flex items-center gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t("ai_briefing")}
            </p>
            {briefing ? <AiSourceBadge source={briefing.source} /> : null}
          </div>
          {loadingBriefing ? (
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {t("state_loading")}
            </p>
          ) : briefing ? (
            <p className="text-xs leading-relaxed text-ink-soft">{pickLang(briefing, "briefing", lang)}</p>
          ) : null}
        </div>
      ) : null}

      {/* Timeline */}
      {showTimeline ? (
        <div className="rounded-lg border border-slate-100 bg-surface-soft px-3 py-3">
          <p className="mb-2 text-xs font-semibold text-ink">{t("timeline_title")}</p>
          {loadingTimeline ? (
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {t("state_loading")}
            </p>
          ) : (
            <ol className="space-y-2">
              {(timeline ?? []).map((ev, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {ev.event} · <span className="font-normal text-ink-muted">{ev.actor}</span>
                    </p>
                    {ev.note ? <p className="text-ink-soft">{ev.note}</p> : null}
                    <p className="text-[10px] text-ink-faint">{shortDate(ev.at, lang)} · {new Date(ev.at).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}

      {/* --- Modals --- */}
      <Modal
        open={modal === "verify"}
        title={t("modal_verify_title")}
        onClose={close}
        footer={
          <>
            <button onClick={close} className={btnGhost}>{t("act_cancel")}</button>
            <button
              onClick={() => {
                actions.onVerify(rec.recommendation_id, { confirmed_qty: verifyQty, note: verifyNote || undefined });
                close();
              }}
              className={btnPrimary}
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              {t("act_verify_stock")}
            </button>
          </>
        }
      >
        <Field label={t("modal_verify_qty")}>
          <input type="number" min={0} value={verifyQty} onChange={(e) => setVerifyQty(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
        </Field>
        <Field label={t("modal_note")}>
          <textarea value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)} rows={2} className={inputCls} />
        </Field>
      </Modal>

      <Modal
        open={modal === "approve"}
        title={t("modal_approve_title")}
        onClose={close}
        footer={
          <>
            <button onClick={close} className={btnGhost}>{t("act_cancel")}</button>
            <button
              onClick={() => {
                actions.onApprove(rec.recommendation_id, { actual_qty: approveQty, modify_reason: modifyReason || undefined });
                close();
              }}
              className={btnPrimary}
            >
              <Check className="h-4 w-4" aria-hidden />
              {t("rec_approve")}
            </button>
          </>
        }
      >
        <Field label={t("modal_approve_qty")}>
          <input type="number" min={0} value={approveQty} onChange={(e) => setApproveQty(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
        </Field>
        <Field label={t("modal_modify_reason")}>
          <textarea value={modifyReason} onChange={(e) => setModifyReason(e.target.value)} rows={2} className={inputCls} />
        </Field>
      </Modal>

      <Modal
        open={modal === "reject"}
        title={t("modal_reject_title")}
        onClose={close}
        footer={
          <>
            <button onClick={close} className={btnGhost}>{t("act_cancel")}</button>
            <button
              onClick={() => {
                if (!rejectReason.trim()) {
                  setRejectErr(true);
                  return;
                }
                actions.onReject(rec.recommendation_id, rejectReason.trim());
                setRejectReason("");
                close();
              }}
              className={btnDanger}
            >
              <X className="h-4 w-4" aria-hidden />
              {t("rec_reject")}
            </button>
          </>
        }
      >
        <Field label={t("modal_reject_reason")}>
          <textarea value={rejectReason} onChange={(e) => { setRejectReason(e.target.value); setRejectErr(false); }} rows={3} className={clsx(inputCls, rejectErr && "border-critical")} />
          {rejectErr ? <p className="mt-1 text-xs text-critical-text">{t("modal_reject_required")}</p> : null}
        </Field>
      </Modal>

      <Modal
        open={modal === "assign"}
        title={t("modal_assign_title")}
        onClose={close}
        footer={
          <>
            <button onClick={close} className={btnGhost}>{t("act_cancel")}</button>
            <button
              onClick={() => {
                actions.onAssign(rec.recommendation_id, assignModel || undefined);
                close();
              }}
              className={btnPrimary}
            >
              <Truck className="h-4 w-4" aria-hidden />
              {t("act_assign_logistics")}
            </button>
          </>
        }
      >
        <Field label={t("modal_assign_model")}>
          <select value={assignModel} onChange={(e) => setAssignModel(e.target.value as LogisticsModel | "")} className={inputCls}>
            <option value="">{t("logi_piggyback")}</option>
            <option value="piggyback">{t("logi_piggyback")}</option>
            <option value="hub_and_spoke">{t("logi_hub_and_spoke")}</option>
            <option value="emergency_lateral">{t("logi_emergency_lateral")}</option>
            <option value="return_to_store">{t("logi_return_to_store")}</option>
          </select>
        </Field>
      </Modal>

      <Modal
        open={modal === "confirm"}
        title={t("modal_confirm_delivery_title")}
        onClose={close}
        footer={
          <>
            <button onClick={close} className={btnGhost}>{t("act_cancel")}</button>
            <button
              onClick={() => {
                actions.onConfirm(rec.recommendation_id, { received_qty: receivedQty, received_condition: condition });
                close();
              }}
              className={btnPrimary}
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              {t("act_confirm_delivery")}
            </button>
          </>
        }
      >
        <Field label={t("modal_received_qty")}>
          <input type="number" min={0} value={receivedQty} onChange={(e) => setReceivedQty(Math.max(0, Number(e.target.value) || 0))} className={inputCls} />
        </Field>
        <Field label={t("modal_received_condition")}>
          <select value={condition} onChange={(e) => setCondition(e.target.value as ReceivedCondition)} className={inputCls}>
            <option value="good">{t("cond_good")}</option>
            <option value="damaged">{t("cond_damaged")}</option>
            <option value="partial">{t("cond_partial")}</option>
          </select>
        </Field>
      </Modal>
    </div>
  );
}

const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";
const btnDanger =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-critical-bg hover:text-critical-text disabled:opacity-50";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-soft disabled:opacity-50";
const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
