"use client";

import { useCallback } from "react";
import { Download, PackageX, ShieldCheck, Truck, ThumbsUp } from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { SimpleBarChart, SEMANTIC_COLORS } from "@/components/charts";
import { ProgressBar } from "@/components/ProgressBar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KpiSkeletonRow } from "@/components/LoadingState";
import { ErrorState } from "@/components/EmptyState";
import { inr, num, pct, scoreSemantic } from "@/lib/format";
import type { ReportSummary } from "@/lib/types";

function exportCsv(report: ReportSummary) {
  const lines: string[] = [];
  lines.push("Section,Metric,Value");
  lines.push(`Summary,Waste avoided (units),${report.waste_avoided_units}`);
  lines.push(`Summary,Waste avoided (value),${report.waste_avoided_value}`);
  lines.push(`Summary,Stockouts prevented,${report.stockouts_prevented}`);
  lines.push(`Summary,Transfer completion rate,${report.transfer_completion_rate}`);
  lines.push(`Summary,Recommendation acceptance rate,${report.recommendation_acceptance_rate}`);
  report.top_risky_medicines.forEach((m) =>
    lines.push(`Top risky medicine,${m.name},${m.risk_score}`),
  );
  report.top_risky_phcs.forEach((p) =>
    lines.push(`Top risky PHC,${p.name},${p.health_score}`),
  );
  report.trend.forEach((w) =>
    lines.push(`Trend ${w.week},stockouts=${w.stockouts},waste=${w.waste}`),
  );
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smart-health-report-2026-07-08.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t, lang } = useApp();
  const fetcher = useCallback(() => api.getReport(lang), [lang]);
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [lang]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("rp_title")}
        subtitle={t("rp_subtitle")}
        action={
          <button
            onClick={() => data && exportCsv(data)}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-surface-soft disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("rp_export_csv")}
          </button>
        }
      />
      <OfflineBanner show={fromMock} />

      {loading ? (
        <KpiSkeletonRow count={4} />
      ) : error || !data ? (
        <ErrorState
          title={t("state_error_title")}
          message={t("state_error_body")}
          onRetry={reload}
          retryLabel={t("retry")}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label={t("rp_waste_avoided")}
              value={num(data.waste_avoided_units)}
              sub={`${inr(data.waste_avoided_value)} ${t("rp_waste_value").toLowerCase()}`}
              icon={PackageX}
              tone="healthy"
            />
            <MetricCard
              label={t("rp_stockouts_prevented")}
              value={data.stockouts_prevented}
              icon={ShieldCheck}
              tone="healthy"
            />
            <MetricCard
              label={t("rp_transfer_rate")}
              value={pct(data.transfer_completion_rate)}
              icon={Truck}
              tone="info"
            />
            <MetricCard
              label={t("rp_acceptance_rate")}
              value={pct(data.recommendation_acceptance_rate)}
              icon={ThumbsUp}
              tone="info"
            />
          </div>

          <Card>
            <CardHeader title={t("rp_trend")} />
            <SimpleBarChart
              data={data.trend as unknown as Record<string, unknown>[]}
              xKey="week"
              bars={[
                { key: "stockouts", name: t("rp_stockouts"), color: SEMANTIC_COLORS.critical },
                { key: "waste", name: t("rp_waste"), color: SEMANTIC_COLORS.warning },
              ]}
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={t("rp_top_medicines")} />
              <ul className="space-y-3">
                {data.top_risky_medicines.map((m) => (
                  <li key={m.medicine_id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm font-medium text-ink">
                      {m.name}
                    </span>
                    <ProgressBar
                      value={m.risk_score}
                      tone={m.risk_score > 0.75 ? "critical" : m.risk_score > 0.6 ? "warning" : "info"}
                    />
                    <span className="w-10 shrink-0 text-right text-sm tabular-nums text-ink-soft">
                      {pct(m.risk_score)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title={t("rp_top_phcs")} />
              <ul className="space-y-3">
                {data.top_risky_phcs.map((p) => (
                  <li key={p.phc_id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm font-medium text-ink">
                      {p.name}
                    </span>
                    <ProgressBar value={p.health_score} tone={scoreSemantic(p.health_score)} />
                    <span className="w-10 shrink-0 text-right text-sm tabular-nums text-ink-soft">
                      {pct(p.health_score)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
