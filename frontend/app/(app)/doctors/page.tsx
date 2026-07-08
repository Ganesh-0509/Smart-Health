"use client";

import { useCallback } from "react";
import { UserCheck, UserX, UserMinus, Percent } from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable, type Column } from "@/components/DataTable";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/EmptyState";
import { pct } from "@/lib/format";
import type { Doctor, DoctorStatus } from "@/lib/types";
import type { Semantic } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";

const statusMeta: Record<DoctorStatus, { sem: Semantic; key: DictKey }> = {
  present: { sem: "healthy", key: "doc_present" },
  absent: { sem: "critical", key: "doc_absent" },
  on_leave: { sem: "warning", key: "doc_on_leave" },
};

export default function DoctorsPage() {
  const { t, phcScope } = useApp();
  const listFetcher = useCallback(() => api.getDoctors(phcScope), [phcScope]);
  const sumFetcher = useCallback(() => api.getDoctorSummary(phcScope), [phcScope]);
  const list = useApi(listFetcher, [phcScope]);
  const summary = useApi(sumFetcher, [phcScope]);

  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: t("doc_name"),
      sortable: true,
      sortValue: (r) => r.doctor_name,
      render: (r) => <span className="font-medium text-ink">{r.doctor_name}</span>,
    },
    {
      key: "specialty",
      header: t("doc_specialty"),
      sortable: true,
      sortValue: (r) => r.specialty,
      render: (r) => <span className="text-ink-soft">{r.specialty}</span>,
    },
    {
      key: "phc",
      header: t("col_phc"),
      sortable: true,
      sortValue: (r) => r.phc_name,
      render: (r) => <span className="text-ink-soft">{r.phc_name}</span>,
    },
    {
      key: "status",
      header: t("rec_status"),
      align: "center",
      sortable: true,
      sortValue: (r) => ({ absent: 0, on_leave: 1, present: 2 })[r.status],
      render: (r) => (
        <StatusBadge semantic={statusMeta[r.status].sem} label={t(statusMeta[r.status].key)} size="sm" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("doc_title")} subtitle={t("doc_subtitle")} />
      <OfflineBanner show={list.fromMock || summary.fromMock} />

      {summary.loading ? (
        <Card>
          <LoadingState rows={2} />
        </Card>
      ) : summary.data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label={t("doc_present")} value={`${summary.data.present}/${summary.data.expected}`} icon={UserCheck} tone="healthy" />
          <MetricCard label={t("doc_absent")} value={summary.data.absent} icon={UserX} tone={summary.data.absent > 0 ? "critical" : "healthy"} />
          <MetricCard label={t("doc_on_leave")} value={summary.data.on_leave} icon={UserMinus} tone="warning" />
          <MetricCard label={t("doc_attendance_rate")} value={pct(summary.data.attendance_rate)} icon={Percent} tone={summary.data.attendance_rate >= 0.8 ? "healthy" : "warning"} />
        </div>
      ) : null}

      <Card className="p-2">
        {list.loading ? (
          <div className="p-3">
            <LoadingState rows={5} />
          </div>
        ) : list.error || !list.data ? (
          <div className="p-3">
            <ErrorState
              title={t("state_error_title")}
              message={t("state_error_body")}
              onRetry={list.reload}
              retryLabel={t("retry")}
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={list.data}
            getRowKey={(r, i) => `${r.phc_id}-${r.doctor_name}-${i}`}
            initialSort={{ key: "status", dir: "asc" }}
            emptyContent={t("state_empty_title")}
          />
        )}
      </Card>
    </div>
  );
}
