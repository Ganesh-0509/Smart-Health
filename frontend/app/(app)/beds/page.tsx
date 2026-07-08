"use client";

import { useCallback } from "react";
import { BedDouble } from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { RiskBadge } from "@/components/RiskBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { pct, timeAgo } from "@/lib/format";
import type { BedRecord, RiskLevel } from "@/lib/types";

function occTone(rate: number): RiskLevel {
  if (rate >= 0.85) return "critical";
  if (rate >= 0.6) return "warning";
  return "healthy";
}

function SectionBar({ label, section }: { label: string; section: { total: number; occupied: number } }) {
  const rate = section.total ? section.occupied / section.total : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-ink-soft">{label}</span>
        <span className="tabular-nums text-ink-muted">
          {section.occupied}/{section.total}
        </span>
      </div>
      <ProgressBar value={rate} tone={occTone(rate)} height="h-1.5" />
    </div>
  );
}

export default function BedsPage() {
  const { t, lang, phcScope } = useApp();
  const fetcher = useCallback(() => api.getBeds(phcScope), [phcScope]);
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [phcScope]);

  const totals = (data ?? []).reduce(
    (acc, b) => {
      acc.total += b.total_beds;
      acc.occupied += b.occupied_beds;
      acc.available += b.available_beds;
      return acc;
    },
    { total: 0, occupied: 0, available: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("bed_title")} subtitle={t("bed_subtitle")} />
      <OfflineBanner show={fromMock} />

      {loading ? (
        <Card>
          <LoadingState rows={5} />
        </Card>
      ) : error ? (
        <ErrorState
          title={t("state_error_title")}
          message={t("state_error_body")}
          onRetry={reload}
          retryLabel={t("retry")}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState title={t("state_empty_title")} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label={t("kpi_beds_available")} value={totals.available} icon={BedDouble} tone="healthy" />
            <MetricCard label={t("bed_occupancy")} value={pct(totals.total ? totals.occupied / totals.total : 0)} tone={occTone(totals.total ? totals.occupied / totals.total : 0)} />
            <MetricCard label={t("nav_beds")} value={totals.total} tone="info" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((b: BedRecord) => (
              <Card key={b.phc_id}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{b.phc_name}</p>
                    <p className="text-xs text-ink-muted">
                      {t("updated")} {timeAgo(b.updated_at, lang)}
                    </p>
                  </div>
                  <RiskBadge risk={b.status} size="sm" />
                </div>

                <div className="mb-4 flex items-end justify-between rounded-xl bg-surface-soft p-3">
                  <div>
                    <p className="text-2xl font-bold text-ink">
                      {b.available_beds}
                      <span className="ml-1 text-sm font-normal text-ink-muted">
                        {t("bed_available")}
                      </span>
                    </p>
                    <p className="text-xs text-ink-muted">
                      {b.occupied_beds} {t("of")} {b.total_beds}
                    </p>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-ink-soft">
                    {pct(b.occupancy_rate)}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <SectionBar label={t("bed_general")} section={b.general} />
                  <SectionBar label={t("bed_icu")} section={b.icu} />
                  <SectionBar label={t("bed_maternity")} section={b.maternity} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
