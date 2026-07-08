"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  PackageX,
  CalendarClock,
  GitCompareArrows,
  BedDouble,
  Stethoscope,
  Users,
  FlaskConical,
  Bell,
  ArrowRight,
  Boxes,
  LineChart,
  Map,
} from "lucide-react";
import { useApp, pickLang } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardHeader } from "@/components/Card";
import { AlertBanner } from "@/components/AlertBanner";
import { TrendChart } from "@/components/TrendChart";
import { DonutChart, SEMANTIC_COLORS } from "@/components/charts";
import { OfflineBanner } from "@/components/OfflineBanner";
import { KpiSkeletonRow } from "@/components/LoadingState";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { num, shortDate } from "@/lib/format";

export default function DashboardPage() {
  const { t, lang, phcScope } = useApp();
  const fetcher = useCallback(
    () => api.getDashboard(phcScope, lang),
    [phcScope, lang],
  );
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [phcScope, lang]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav_dashboard")} subtitle={t("appTagline")} />
      <OfflineBanner show={fromMock} />

      {loading ? (
        <>
          <KpiSkeletonRow count={4} />
          <KpiSkeletonRow count={4} />
        </>
      ) : error || !data ? (
        <ErrorState
          title={t("state_error_title")}
          message={t("state_error_body")}
          onRetry={reload}
          retryLabel={t("retry")}
        />
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label={t("kpi_shortage_risk")}
              value={data.kpis.items_at_shortage_risk}
              icon={PackageX}
              tone={data.kpis.items_at_shortage_risk > 0 ? "critical" : "healthy"}
              href="/inventory"
            />
            <MetricCard
              label={t("kpi_near_expiry")}
              value={data.kpis.items_near_expiry}
              icon={CalendarClock}
              tone={data.kpis.items_near_expiry > 0 ? "warning" : "healthy"}
              href="/inventory"
            />
            <MetricCard
              label={t("kpi_pending_recs")}
              value={data.kpis.pending_recommendations}
              icon={GitCompareArrows}
              tone="info"
              href="/recommendations"
            />
            <MetricCard
              label={t("kpi_active_alerts")}
              value={data.kpis.active_alerts}
              icon={Bell}
              tone={data.kpis.active_alerts > 5 ? "warning" : "info"}
              href="/alerts"
            />
          </div>

          {/* Operational KPI grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label={t("kpi_beds_available")}
              value={data.kpis.beds_available}
              sub={`${t("of")} ${data.kpis.beds_total} ${t("bed_available")}`}
              icon={BedDouble}
              tone="healthy"
              href="/beds"
            />
            <MetricCard
              label={t("kpi_doctors_present")}
              value={`${data.kpis.doctors_present}/${data.kpis.doctors_expected}`}
              icon={Stethoscope}
              tone={
                data.kpis.doctors_present >= data.kpis.doctors_expected
                  ? "healthy"
                  : "warning"
              }
              href="/doctors"
            />
            <MetricCard
              label={t("kpi_footfall_today")}
              value={num(data.kpis.footfall_today)}
              icon={Users}
              tone="info"
              href="/footfall"
            />
            <MetricCard
              label={t("kpi_tests_unavailable")}
              value={data.kpis.tests_unavailable}
              icon={FlaskConical}
              tone={data.kpis.tests_unavailable > 0 ? "warning" : "healthy"}
              href="/tests"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title={t("sec_demand_trend")} subtitle={t("appTagline")} />
              <TrendChart
                data={data.demand_trend as unknown as Record<string, unknown>[]}
                xKey="date"
                xTickFormatter={(v) => shortDate(v, lang)}
                series={[
                  { key: "actual", name: t("actual"), color: SEMANTIC_COLORS.slate, type: "area" },
                  {
                    key: "predicted",
                    name: t("predicted"),
                    color: SEMANTIC_COLORS.brand,
                    type: "area",
                    strokeDasharray: "5 4",
                  },
                ]}
              />
            </Card>

            <Card>
              <CardHeader title={t("sec_stock_health")} />
              <DonutChart
                centerLabel={t("nav_inventory")}
                data={[
                  { name: t("risk_healthy"), value: data.stock_health.healthy, color: SEMANTIC_COLORS.healthy },
                  { name: t("risk_warning"), value: data.stock_health.warning, color: SEMANTIC_COLORS.warning },
                  { name: t("risk_critical"), value: data.stock_health.critical, color: SEMANTIC_COLORS.critical },
                ]}
              />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: t("risk_healthy"), value: data.stock_health.healthy, color: "text-healthy" },
                  { label: t("risk_warning"), value: data.stock_health.warning, color: "text-warning" },
                  { label: t("risk_critical"), value: data.stock_health.critical, color: "text-critical" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-surface-soft p-2">
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-ink-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Alerts + quick links */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title={t("sec_top_alerts")}
                action={
                  <Link
                    href="/alerts"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    {t("view_all")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              {data.top_alerts.length === 0 ? (
                <EmptyState title={t("state_empty_title")} message={t("state_empty_healthy")} />
              ) : (
                <div className="space-y-2.5">
                  {data.top_alerts.map((a) => (
                    <AlertBanner
                      key={a.id}
                      type={a.type}
                      risk={a.risk_level}
                      title={pickLang(a, "title", lang)}
                      message={pickLang(a, "message", lang)}
                      compact
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title={t("sec_quick_links")} />
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { href: "/inventory", label: t("nav_inventory"), icon: Boxes },
                  { href: "/forecast", label: t("nav_forecast"), icon: LineChart },
                  { href: "/recommendations", label: t("nav_recommendations"), icon: GitCompareArrows },
                  { href: "/district", label: t("nav_district"), icon: Map },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <Icon className="h-5 w-5 text-brand-600" aria-hidden />
                    <span className="text-xs font-medium text-ink">{label}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
