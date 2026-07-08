"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Gauge, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { FilterSelect } from "@/components/FilterSelect";
import { ForecastChart } from "@/components/charts";
import { ProgressBar } from "@/components/ProgressBar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/EmptyState";
import { pct, shortDate } from "@/lib/format";
import { useMockCatalog } from "@/lib/useCatalog";

function ForecastInner() {
  const { t, lang, phcs, phcScope } = useApp();
  const params = useSearchParams();
  const { medicines } = useMockCatalog();

  const [phc, setPhc] = useState<string>("");
  const [med, setMed] = useState<string>("");

  // Seed from query params / scope / first available.
  useEffect(() => {
    const qp = params.get("phc");
    setPhc(qp || phcScope || phcs[0]?.phc_id || "PHC-01");
  }, [params, phcScope, phcs]);
  useEffect(() => {
    const qm = params.get("med");
    setMed(qm || medicines[0]?.medicine_id || "MED-01");
  }, [params, medicines]);

  const ready = Boolean(phc && med);
  const fcFetcher = useCallback(() => api.getForecast(phc, med), [phc, med]);
  const fc = useApi(fcFetcher, [phc, med]);
  const metrics = useApi(useCallback(() => api.getForecastMetrics(), []), []);

  // Merge history + forecast for a single continuous chart.
  const chartData = useMemo(() => {
    if (!fc.data) return [];
    const hist = fc.data.history.map((h) => ({
      date: shortDate(h.date, lang),
      history: h.usage as number | null,
      predicted: null as number | null,
      lower: null as number | null,
      band: null as number | null,
    }));
    // bridge point so lines connect
    const lastHist = fc.data.history[fc.data.history.length - 1];
    const fut = fc.data.forecast.map((f, i) => ({
      date: shortDate(f.date, lang),
      history: i === 0 ? lastHist?.usage ?? null : null,
      predicted: f.predicted as number | null,
      lower: f.lower as number | null,
      band: (f.upper - f.lower) as number | null,
    }));
    return [...hist, ...fut];
  }, [fc.data, lang]);

  const factors = fc.data
    ? lang === "hi"
      ? fc.data.explain.top_factors_hi
      : fc.data.explain.top_factors_en
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("fc_title")} subtitle={t("fc_subtitle")} />
      <OfflineBanner show={fc.fromMock || metrics.fromMock} />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label={t("fc_select_phc")}
            value={phc}
            onChange={setPhc}
            allLabel={t("fc_select_phc")}
            options={phcs.map((p) => ({ value: p.phc_id, label: p.name }))}
          />
          <FilterSelect
            label={t("fc_select_medicine")}
            value={med}
            onChange={setMed}
            allLabel={t("fc_select_medicine")}
            options={medicines.map((m) => ({ value: m.medicine_id, label: m.name }))}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t("fc_forecast")}
            subtitle={`${t("fc_history")} + ${t("fc_band")}`}
          />
          {!ready || fc.loading ? (
            <div className="py-8">
              <LoadingState rows={4} />
            </div>
          ) : fc.error || !fc.data ? (
            <ErrorState
              title={t("state_error_title")}
              message="Forecast data unavailable for this PHC."
              onRetry={fc.reload}
              retryLabel={t("retry")}
            />
          ) : (
            <ForecastChart data={chartData} />
          )}
        </Card>

        {/* Risk + why */}
        <div className="space-y-4">
          <Card>
            <CardHeader title={t("fc_risk_score")} />
            {fc.data ? (
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold tabular-nums text-ink">
                    {pct(fc.data.risk_score)}
                  </span>
                  <Gauge className="mb-1.5 h-5 w-5 text-ink-faint" aria-hidden />
                </div>
                <div className="mt-3">
                  <ProgressBar
                    value={fc.data.risk_score}
                    tone={
                      fc.data.risk_score > 0.66
                        ? "critical"
                        : fc.data.risk_score > 0.4
                          ? "warning"
                          : "healthy"
                    }
                  />
                </div>
                <p className="mt-3 text-xs text-ink-muted">
                  {t("fc_model")}: {fc.data.model} · v{fc.data.model_version}
                </p>
              </div>
            ) : (
              <LoadingState rows={2} />
            )}
          </Card>

          <Card>
            <CardHeader title={t("fc_why")} />
            {factors.length ? (
              <ul className="space-y-2.5">
                {factors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Sparkles className="h-3 w-3" aria-hidden />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <LoadingState rows={3} />
            )}
          </Card>
        </div>
      </div>

      {/* Model metrics */}
      <Card>
        <CardHeader title={t("fc_model_metrics")} subtitle={t("fc_improvement")} />
        {metrics.data ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg bg-healthy-bg px-3 py-2 text-sm font-semibold text-healthy-text">
                <TrendingUp className="h-4 w-4" aria-hidden />
                {metrics.data.improvement_pct.toFixed(1)}% {t("fc_improvement")}
              </span>
              <span className="text-xs text-ink-muted">
                {t("fc_model")}: {metrics.data.model} · {t("fc_baseline")}: {metrics.data.baseline}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3">Metric</th>
                    {(["MAE", "RMSE", "MAPE", "WAPE", "bias"] as const).map((k) => (
                      <th key={k} className="px-3 py-2 text-right">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 pr-3 font-medium text-ink">{t("fc_model")}</td>
                    {(["MAE", "RMSE", "MAPE", "WAPE", "bias"] as const).map((k) => (
                      <td key={k} className="px-3 py-2.5 text-right font-semibold tabular-nums text-healthy-text">
                        {metrics.data!.metrics[k]}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3 text-ink-muted">{t("fc_baseline")}</td>
                    {(["MAE", "RMSE", "MAPE", "WAPE", "bias"] as const).map((k) => (
                      <td key={k} className="px-3 py-2.5 text-right tabular-nums text-ink-muted">
                        {metrics.data!.baseline_metrics[k]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <LoadingState rows={2} />
        )}
      </Card>
    </div>
  );
}

export default function ForecastPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading…</div>}>
      <ForecastInner />
    </Suspense>
  );
}
