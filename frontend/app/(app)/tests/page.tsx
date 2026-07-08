"use client";

import { useCallback, useMemo, useState } from "react";
import { FlaskConical, CheckCircle2, XCircle } from "lucide-react";
import { useApp, pickLang } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { FilterSelect } from "@/components/FilterSelect";
import { StatusBadge } from "@/components/StatusBadge";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState, ErrorState } from "@/components/EmptyState";
import { timeAgo } from "@/lib/format";

export default function TestsPage() {
  const { t, lang, phcScope } = useApp();
  const [avail, setAvail] = useState<string>("");

  const availBool = avail === "" ? null : avail === "yes";
  const fetcher = useCallback(
    () => api.getTests({ phc_id: phcScope, available: availBool, lang }),
    [phcScope, availBool, lang],
  );
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [phcScope, avail, lang]);

  const counts = useMemo(() => {
    const c = { up: 0, down: 0 };
    (data ?? []).forEach((r) => (r.available ? c.up++ : c.down++));
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("test_title")} subtitle={t("test_subtitle")} />
      <OfflineBanner show={fromMock} />

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label={t("test_available")} value={counts.up} icon={CheckCircle2} tone="healthy" />
        <MetricCard label={t("test_unavailable")} value={counts.down} icon={XCircle} tone={counts.down > 0 ? "critical" : "healthy"} />
        <MetricCard label={t("nav_tests")} value={(data ?? []).length} icon={FlaskConical} tone="info" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label={t("test_available")}
            value={avail}
            onChange={setAvail}
            allLabel={t("al_all_types")}
            options={[
              { value: "yes", label: t("test_available") },
              { value: "no", label: t("test_unavailable") },
            ]}
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
        <EmptyState title={t("state_empty_title")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.map((tst, i) => {
            const reason = pickLang(tst, "reason", lang);
            return (
              <Card key={`${tst.phc_id}-${tst.test_name}-${i}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{tst.test_name}</p>
                  <p className="text-xs text-ink-muted">
                    {tst.category} · {tst.phc_name}
                  </p>
                  {!tst.available && reason ? (
                    <p className="mt-2 text-sm text-critical-text">
                      {t("test_reason")}: {reason}
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-ink-faint">
                    {t("updated")} {timeAgo(tst.updated_at, lang)}
                  </p>
                </div>
                <StatusBadge
                  semantic={tst.available ? "healthy" : "critical"}
                  label={tst.available ? t("test_available") : t("test_unavailable")}
                  size="sm"
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
