"use client";

import { useCallback, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Flag, Map as MapIcon, Table2, AlertOctagon } from "lucide-react";
import { useApp, pickLang } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { RiskBadge } from "@/components/RiskBadge";
import { DataTable, type Column } from "@/components/DataTable";
import { ProgressBar } from "@/components/ProgressBar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/EmptyState";
import { pct, scoreSemantic } from "@/lib/format";
import type { PhcScore } from "@/lib/types";

function DistrictMap({ scores, lang }: { scores: PhcScore[]; lang: "en" | "hi" }) {
  const lats = scores.map((s) => s.latitude);
  const lngs = scores.map((s) => s.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;

  const dotColor: Record<string, string> = {
    healthy: "bg-healthy",
    warning: "bg-warning",
    critical: "bg-critical",
  };

  return (
    <div
      className="relative h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 bg-brand-50/40"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)",
        backgroundSize: "26px 26px",
      }}
    >
      {scores.map((s) => {
        // pad 8% so markers don't touch edges
        const x = 8 + ((s.longitude - minLng) / spanLng) * 84;
        const y = 8 + ((maxLat - s.latitude) / spanLat) * 84;
        return (
          <div
            key={s.phc_id}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="flex flex-col items-center">
              <span className="relative flex">
                {s.flagged ? (
                  <span
                    className={clsx(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                      dotColor[s.risk_level],
                    )}
                  />
                ) : null}
                <span
                  className={clsx(
                    "relative flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white",
                    dotColor[s.risk_level],
                  )}
                >
                  {s.flagged ? <Flag className="h-2.5 w-2.5 text-white" aria-hidden /> : null}
                </span>
              </span>
              <span className="mt-1 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink shadow-sm">
                {s.name}
              </span>
            </div>

            {/* Hover card */}
            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-52 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-pop group-hover:block">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">{s.name}</span>
                <RiskBadge risk={s.risk_level} size="sm" />
              </div>
              <p className="text-[11px] text-ink-muted">
                Health score: {pct(s.health_score)}
              </p>
              {s.flagged ? (
                <p className="mt-1 text-[11px] text-critical-text">
                  {pickLang(s, "flag_reason", lang)}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] shadow-sm">
        {(["healthy", "warning", "critical"] as const).map((r) => (
          <span key={r} className="flex items-center gap-1.5">
            <span className={clsx("h-2.5 w-2.5 rounded-full", dotColor[r])} />
            <span className="capitalize text-ink-soft">{r}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DistrictPage() {
  const { t, lang } = useApp();
  const [view, setView] = useState<"map" | "table">("map");
  const fetcher = useCallback(() => api.getDistrict(lang), [lang]);
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [lang]);

  const columns: Column<PhcScore>[] = useMemo(
    () => [
      {
        key: "name",
        header: t("col_phc"),
        sortable: true,
        sortValue: (r) => r.name,
        render: (r) => (
          <div className="flex items-center gap-2">
            {r.flagged ? <Flag className="h-3.5 w-3.5 text-critical" aria-hidden /> : null}
            <span className="font-medium text-ink">{r.name}</span>
            <span className="text-[10px] uppercase text-ink-faint">{r.type}</span>
          </div>
        ),
      },
      {
        key: "health",
        header: t("dist_health_score"),
        sortable: true,
        sortValue: (r) => r.health_score,
        render: (r) => (
          <div className="flex items-center gap-2">
            <div className="w-28">
              <ProgressBar value={r.health_score} tone={scoreSemantic(r.health_score)} />
            </div>
            <span className="w-10 text-right text-sm tabular-nums text-ink-soft">
              {pct(r.health_score)}
            </span>
          </div>
        ),
      },
      { key: "stock", header: t("dist_stock_risk"), align: "right", sortable: true, sortValue: (r) => r.stock_risk, render: (r) => <span className="tabular-nums text-ink-muted">{pct(r.stock_risk)}</span> },
      { key: "bed", header: t("dist_bed_pressure"), align: "right", sortable: true, sortValue: (r) => r.bed_pressure, render: (r) => <span className="tabular-nums text-ink-muted">{pct(r.bed_pressure)}</span> },
      { key: "doctor", header: t("dist_doctor_gap"), align: "right", sortable: true, sortValue: (r) => r.doctor_gap, render: (r) => <span className="tabular-nums text-ink-muted">{pct(r.doctor_gap)}</span> },
      { key: "test", header: t("dist_test_gap"), align: "right", sortable: true, sortValue: (r) => r.test_gap, render: (r) => <span className="tabular-nums text-ink-muted">{pct(r.test_gap)}</span> },
      {
        key: "risk",
        header: t("col_risk"),
        align: "center",
        sortable: true,
        sortValue: (r) => ({ critical: 0, warning: 1, healthy: 2 })[r.risk_level],
        render: (r) => <RiskBadge risk={r.risk_level} size="sm" />,
      },
    ],
    [t],
  );

  const flagged = (data?.phc_scores ?? []).filter((s) => s.flagged);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dist_title")}
        subtitle={t("dist_subtitle")}
        action={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium">
            <button
              onClick={() => setView("map")}
              aria-pressed={view === "map"}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
                view === "map" ? "bg-brand-600 text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              <MapIcon className="h-3.5 w-3.5" /> {t("dist_map_view")}
            </button>
            <button
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
                view === "table" ? "bg-brand-600 text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              <Table2 className="h-3.5 w-3.5" /> {t("dist_table_view")}
            </button>
          </div>
        }
      />
      <OfflineBanner show={fromMock} />

      {loading ? (
        <Card>
          <LoadingState rows={6} />
        </Card>
      ) : error || !data ? (
        <ErrorState
          title={t("state_error_title")}
          message={t("state_error_body")}
          onRetry={reload}
          retryLabel={t("retry")}
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label={t("dist_avg_score")} value={pct(data.district_kpis.avg_health_score)} tone={scoreSemantic(data.district_kpis.avg_health_score)} />
            <MetricCard label={t("dist_total_phcs")} value={data.district_kpis.total_phcs} tone="info" />
            <MetricCard label={t("dist_critical_phcs")} value={data.district_kpis.critical_phcs} tone={data.district_kpis.critical_phcs > 0 ? "critical" : "healthy"} />
          </div>

          {/* Flagged centres callout */}
          {flagged.length ? (
            <Card>
              <CardHeader
                title={`${t("dist_flagged_centres")} (${data.flagged_count})`}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {flagged.map((s) => (
                  <div
                    key={s.phc_id}
                    className="flex flex-col gap-2 rounded-xl border border-critical-border bg-critical-bg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        <AlertOctagon className="h-4 w-4 text-critical" aria-hidden />
                        {s.name}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-critical-text">
                        {pct(s.health_score)}
                      </span>
                    </div>
                    <p className="text-xs text-critical-text/90">
                      {pickLang(s, "flag_reason", lang)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {view === "map" ? (
            <Card>
              <CardHeader title={`${data.district} · ${t("dist_map_view")}`} />
              <DistrictMap scores={data.phc_scores} lang={lang} />
            </Card>
          ) : (
            <Card className="p-2">
              <DataTable
                columns={columns}
                rows={data.phc_scores}
                getRowKey={(r) => r.phc_id}
                initialSort={{ key: "health", dir: "asc" }}
                rowClassName={(r) => (r.flagged ? "bg-critical-bg/40" : "")}
                emptyContent={t("state_empty_title")}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
