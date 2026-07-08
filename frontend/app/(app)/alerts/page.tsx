"use client";

import { useCallback, useMemo, useState } from "react";
import { MapPin, Clock } from "lucide-react";
import { useApp, pickLang } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { FilterSelect } from "@/components/FilterSelect";
import { AlertBanner } from "@/components/AlertBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import type { AlertType } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";
import { timeAgo } from "@/lib/format";

const typeKey: Record<AlertType, DictKey> = {
  shortage: "type_shortage",
  expiry: "type_expiry",
  spike: "type_spike",
  transfer_due: "type_transfer_due",
  bed_full: "type_bed_full",
  doctor_absent: "type_doctor_absent",
  test_down: "type_test_down",
};

export default function AlertsPage() {
  const { t, lang, phcScope } = useApp();
  const [type, setType] = useState<string>("");

  const fetcher = useCallback(
    () => api.getAlerts({ phc_id: phcScope, type: (type || null) as AlertType | null, lang }),
    [phcScope, type, lang],
  );
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [phcScope, type, lang]);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, healthy: 0 };
    (data ?? []).forEach((a) => (c[a.risk_level] += 1));
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("al_title")} subtitle={t("al_subtitle")} />
      <OfflineBanner show={fromMock} />

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs text-ink-muted">{t("risk_critical")}</p>
          <p className="mt-1 text-2xl font-bold text-critical">{counts.critical}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted">{t("risk_warning")}</p>
          <p className="mt-1 text-2xl font-bold text-warning-text">{counts.warning}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-muted">{t("kpi_active_alerts")}</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data?.length ?? 0}</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label={t("al_filter_type")}
            value={type}
            onChange={setType}
            allLabel={t("al_all_types")}
            options={(Object.keys(typeKey) as AlertType[]).map((k) => ({
              value: k,
              label: t(typeKey[k]),
            }))}
          />
        </div>
      </Card>

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
        <EmptyState title={t("state_empty_title")} message={t("state_empty_healthy")} />
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <AlertBanner
              key={a.id}
              type={a.type}
              risk={a.risk_level}
              title={pickLang(a, "title", lang)}
              message={pickLang(a, "message", lang)}
              meta={
                <span className="flex shrink-0 items-center gap-3 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {a.phc_name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {timeAgo(a.created_at, lang)}
                  </span>
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
