"use client";

import { useCallback } from "react";
import { Users, Activity, Ambulance, Clock } from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { TrendChart } from "@/components/TrendChart";
import { SimpleBarChart, SEMANTIC_COLORS } from "@/components/charts";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/EmptyState";
import { num, shortDate } from "@/lib/format";

export default function FootfallPage() {
  const { t, lang, phcScope } = useApp();
  const fetcher = useCallback(() => api.getFootfall(phcScope), [phcScope]);
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [phcScope]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("ff_title")} subtitle={t("ff_subtitle")} />
      <OfflineBanner show={fromMock} />

      {loading ? (
        <Card>
          <LoadingState rows={5} />
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label={`${t("ff_opd")} · ${t("ff_today")}`} value={num(data.today.opd)} icon={Users} tone="info" />
            <MetricCard label={`${t("ff_ipd")} · ${t("ff_today")}`} value={num(data.today.ipd)} icon={Activity} tone="healthy" />
            <MetricCard label={`${t("ff_emergency")} · ${t("ff_today")}`} value={num(data.today.emergency)} icon={Ambulance} tone="critical" />
            <MetricCard label={t("ff_avg_daily")} value={num(data.avg_daily)} sub={`${t("ff_peak_hour")}: ${data.peak_hour}`} icon={Clock} tone="neutral" />
          </div>

          <Card>
            <CardHeader title={t("ff_title")} subtitle={`${t("ff_opd")} / ${t("ff_total")}`} />
            <TrendChart
              data={data.series as unknown as Record<string, unknown>[]}
              xKey="date"
              xTickFormatter={(v) => shortDate(v, lang)}
              series={[
                { key: "total", name: t("ff_total"), color: SEMANTIC_COLORS.brand, type: "area" },
                { key: "opd", name: t("ff_opd"), color: SEMANTIC_COLORS.healthy, type: "area" },
              ]}
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={t("ff_today")} />
              <SimpleBarChart
                data={[
                  { name: t("ff_opd"), value: data.today.opd },
                  { name: t("ff_ipd"), value: data.today.ipd },
                  { name: t("ff_emergency"), value: data.today.emergency },
                ]}
                xKey="name"
                bars={[{ key: "value", name: t("ff_total"), color: SEMANTIC_COLORS.brand }]}
                showLegend={false}
                height={220}
              />
            </Card>

            {data.by_phc && data.by_phc.length ? (
              <Card>
                <CardHeader title={t("ff_by_phc")} />
                <SimpleBarChart
                  data={data.by_phc.map((p) => ({ name: p.phc_name, total: p.total }))}
                  xKey="name"
                  bars={[{ key: "total", name: t("ff_total"), color: SEMANTIC_COLORS.info }]}
                  layout="vertical"
                  showLegend={false}
                  height={240}
                />
              </Card>
            ) : (
              <Card>
                <CardHeader title={t("ff_peak_hour")} />
                <div className="flex h-[240px] flex-col items-center justify-center">
                  <p className="text-4xl font-bold text-ink">{data.peak_hour}</p>
                  <p className="mt-2 text-sm text-ink-muted">{t("ff_peak_hour")}</p>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
