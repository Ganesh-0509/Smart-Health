"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { CalendarClock } from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { RiskBadge, ConfidenceBadge } from "@/components/RiskBadge";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/EmptyState";
import { FilterSelect } from "@/components/FilterSelect";
import type { InventoryItem, RiskLevel } from "@/lib/types";
import { num, shortDate } from "@/lib/format";

export default function InventoryPage() {
  const { t, lang, phcScope, phcs } = useApp();
  const router = useRouter();
  const [medicine, setMedicine] = useState<string>("");
  const [risk, setRisk] = useState<string>("");

  const fetcher = useCallback(
    () => api.getInventory({ phc_id: phcScope, medicine_id: medicine || null, risk_level: (risk || null) as RiskLevel | null }),
    [phcScope, medicine, risk],
  );
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [phcScope, medicine, risk]);

  const medicineOptions = useMemo(() => {
    const map = new Map<string, string>();
    (data ?? []).forEach((r) => map.set(r.medicine_id, r.medicine_name));
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [data]);

  const columns: Column<InventoryItem>[] = [
    {
      key: "phc",
      header: t("col_phc"),
      sortable: true,
      sortValue: (r) => r.phc_name,
      render: (r) => <span className="font-medium text-ink">{r.phc_name}</span>,
    },
    {
      key: "medicine",
      header: t("col_medicine"),
      sortable: true,
      sortValue: (r) => r.medicine_name,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span>{r.medicine_name}</span>
          {r.near_expiry ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning-text">
              <CalendarClock className="h-3 w-3" />
              {t("near_expiry_flag")}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "stock",
      header: t("col_stock"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.stock_qty,
      render: (r) => <span className="tabular-nums">{num(r.stock_qty)}</span>,
    },
    {
      key: "safety",
      header: t("col_safety"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.min_safety_stock,
      render: (r) => <span className="tabular-nums text-ink-muted">{num(r.min_safety_stock)}</span>,
    },
    {
      key: "usage",
      header: t("col_usage"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.avg_daily_usage,
      render: (r) => <span className="tabular-nums text-ink-muted">{r.avg_daily_usage.toFixed(1)}</span>,
    },
    {
      key: "cover",
      header: t("col_cover"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.days_of_cover,
      render: (r) => (
        <span
          className={clsx(
            "tabular-nums font-semibold",
            r.days_of_cover < 4
              ? "text-critical"
              : r.days_of_cover < 10
                ? "text-warning-text"
                : "text-ink",
          )}
        >
          {r.days_of_cover.toFixed(1)}
          {t("days_short")}
        </span>
      ),
    },
    {
      key: "expiry",
      header: t("col_expiry"),
      align: "right",
      sortable: true,
      sortValue: (r) => r.days_to_expiry,
      render: (r) => (
        <span className={clsx("tabular-nums", r.near_expiry ? "text-warning-text" : "text-ink-muted")}>
          {shortDate(r.expiry_date, lang)}
        </span>
      ),
    },
    {
      key: "confidence",
      header: t("col_confidence"),
      align: "center",
      sortable: true,
      sortValue: (r) =>
        ({ very_low: 0, low: 1, medium: 2, high: 3 })[r.data_confidence ?? "high"],
      render: (r) =>
        r.data_confidence ? (
          <div className="flex flex-col items-center gap-0.5">
            <ConfidenceBadge
              confidence={r.data_confidence}
              reason={lang === "hi" ? r.confidence_reason_hi : r.confidence_reason_en}
              size="sm"
            />
            {r.updated_via ? (
              <span className="text-[10px] text-ink-faint">
                {t("updated_via_label")}: {r.updated_via}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      key: "risk",
      header: t("col_risk"),
      align: "center",
      sortable: true,
      sortValue: (r) => ({ critical: 0, warning: 1, healthy: 2 })[r.risk_level],
      render: (r) => <RiskBadge risk={r.risk_level} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("inv_title")} subtitle={t("inv_subtitle")} />
      <OfflineBanner show={fromMock} />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label={t("col_medicine")}
            value={medicine}
            onChange={setMedicine}
            allLabel={t("filter_all_medicines")}
            options={medicineOptions}
          />
          <FilterSelect
            label={t("col_risk")}
            value={risk}
            onChange={setRisk}
            allLabel={t("filter_all_risk")}
            options={[
              { value: "critical", label: t("risk_critical") },
              { value: "warning", label: t("risk_warning") },
              { value: "healthy", label: t("risk_healthy") },
            ]}
          />
          <span className="ml-auto text-xs text-ink-muted">
            {data ? `${data.length} ${t("nav_inventory").toLowerCase()}` : ""}
          </span>
        </div>
      </Card>

      <Card className="p-0">
        {loading ? (
          <div className="p-5">
            <LoadingState rows={6} />
          </div>
        ) : error || !data ? (
          <div className="p-5">
            <ErrorState
              title={t("state_error_title")}
              message={t("state_error_body")}
              onRetry={reload}
              retryLabel={t("retry")}
            />
          </div>
        ) : (
          <div className="p-2">
            <DataTable
              columns={columns}
              rows={data}
              getRowKey={(r) => `${r.phc_id}-${r.medicine_id}-${r.batch_no}`}
              initialSort={{ key: "cover", dir: "asc" }}
              onRowClick={(r) =>
                router.push(`/forecast?phc=${r.phc_id}&med=${r.medicine_id}`)
              }
              rowClassName={(r) =>
                r.risk_level === "critical" ? "bg-critical-bg/40" : ""
              }
              emptyContent={t("state_empty_healthy")}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
