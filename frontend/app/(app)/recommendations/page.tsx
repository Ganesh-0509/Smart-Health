"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FilterSelect } from "@/components/FilterSelect";
import { TransferCard, type TransferActions } from "@/components/TransferCard";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import type { DictKey } from "@/lib/i18n";
import type {
  Recommendation,
  RecommendationStatus,
  Role,
  TransferType,
} from "@/lib/types";
import { clsx } from "clsx";

type TabId = "all" | RecommendationStatus | "in_transit" | "completed";

const TABS: { id: TabId; label: DictKey; match: (s: RecommendationStatus) => boolean }[] = [
  { id: "all", label: "tab_all", match: () => true },
  { id: "awaiting_verification", label: "tab_awaiting_verification", match: (s) => s === "awaiting_verification" },
  { id: "awaiting_approval", label: "tab_awaiting_approval", match: (s) => s === "awaiting_approval" },
  { id: "in_transit", label: "tab_in_transit", match: (s) => s === "approved" || s === "assigned" || s === "picked_up" },
  { id: "completed", label: "tab_completed", match: (s) => s === "stock_updated" },
  { id: "rejected", label: "tab_rejected", match: (s) => s === "rejected" },
];

export default function RecommendationsPage() {
  const { t, lang, role, phcScope } = useApp();
  const actor = (role as Role) ?? "block_manager";

  const [tab, setTab] = useState<TabId>("all");
  const [transferType, setTransferType] = useState<string>("");
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fromMock, setFromMock] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.getRecommendations({
        phc_id: phcScope,
        transfer_type: (transferType || null) as TransferType | null,
        lang,
      });
      setItems(res.data);
      setFromMock(res.fromMock);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [phcScope, transferType, lang]);

  useEffect(() => {
    load();
  }, [load]);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await api.generateRecommendations({ phc_id: phcScope });
      setItems(res.data);
      setFromMock(res.fromMock);
    } finally {
      setRegenerating(false);
    }
  }

  // Wrap a mutating API call: set busy, patch the item in place, clear busy.
  const run = useCallback(
    async (id: string, call: () => Promise<{ data: Recommendation }>) => {
      setBusyId(id);
      try {
        const res = await call();
        setItems((prev) => (prev ?? []).map((r) => (r.recommendation_id === id ? res.data : r)));
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const actions: TransferActions = useMemo(
    () => ({
      onVerify: (id, body) =>
        run(id, () => api.verifyRecommendation(id, { verified_by: actor, confirmed_qty: body.confirmed_qty, note: body.note })),
      onRequestVerification: (id) => run(id, () => api.requestVerification(id, { actor })),
      onApprove: (id, body) =>
        run(id, () => api.approveRecommendation(id, { approved_by: actor, actual_qty: body.actual_qty, modify_reason: body.modify_reason })),
      onReject: (id, reason) => run(id, () => api.rejectRecommendation(id, { rejected_by: actor, reason })),
      onAssign: (id, model) => run(id, () => api.assignRecommendation(id, { actor, logistics_model: model })),
      onPickup: (id) => run(id, () => api.pickupRecommendation(id, { pickup_by: actor })),
      onConfirm: (id, body) =>
        run(id, () => api.confirmRecommendation(id, { received_by: actor, received_qty: body.received_qty, received_condition: body.received_condition })),
      onMarkEmergency: (id) => run(id, () => api.markEmergency(id, { actor })),
      onTimeline: (id) => api.getRecommendationTimeline(id).then((r) => r.data),
    }),
    [actor, run],
  );

  const activeTab = TABS.find((tb) => tb.id === tab) ?? TABS[0];
  const filtered = (items ?? []).filter((r) => activeTab.match(r.status));

  const countFor = (tb: (typeof TABS)[number]) => (items ?? []).filter((r) => tb.match(r.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("rec_title")}
        subtitle={t("rec_subtitle")}
        action={
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {regenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
            {t("rec_regenerate")}
          </button>
        }
      />
      <OfflineBanner show={fromMock} />

      {/* Governance banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-info-border bg-info-bg px-4 py-3.5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-info-text" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-info-text">{t("rec_governance")}</p>
          <p className="mt-0.5 text-xs text-info-text/80">{t("rec_governance_sub")}</p>
        </div>
      </div>

      {/* Filters: status tabs + transfer type */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t("rec_status")}>
            {TABS.map((tb) => {
              const active = tb.id === tab;
              return (
                <button
                  key={tb.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(tb.id)}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 bg-white text-ink-soft hover:bg-surface-soft",
                  )}
                >
                  {t(tb.label)}
                  <span className={clsx("rounded-full px-1.5 text-[10px] font-bold", active ? "bg-white/20" : "bg-slate-100 text-ink-muted")}>
                    {countFor(tb)}
                  </span>
                </button>
              );
            })}
          </div>
          <FilterSelect
            label={t("rec_filter_transfer")}
            value={transferType}
            onChange={setTransferType}
            allLabel={t("tab_all")}
            options={[
              { value: "redistribution", label: t("transfer_redistribution") },
              { value: "return_to_store", label: t("transfer_return_to_store") },
            ]}
          />
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <LoadingState rows={4} />
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState title={t("state_error_title")} message={t("state_error_body")} onRetry={load} retryLabel={t("retry")} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t("state_empty_title")} message={t("state_empty_healthy")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((rec) => (
            <TransferCard
              key={rec.recommendation_id}
              rec={rec}
              actions={actions}
              busy={busyId === rec.recommendation_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
