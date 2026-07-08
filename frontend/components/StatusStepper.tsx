"use client";

import { clsx } from "clsx";
import { Check, XCircle } from "lucide-react";
import { useApp } from "@/lib/context";
import type { DictKey } from "@/lib/i18n";
import type { RecommendationStatus } from "@/lib/types";

// The 6 forward stages, in order.
const STAGES: { status: RecommendationStatus; key: DictKey }[] = [
  { status: "awaiting_verification", key: "step_verify" },
  { status: "awaiting_approval", key: "step_approve" },
  { status: "approved", key: "step_approved" },
  { status: "assigned", key: "step_assign" },
  { status: "picked_up", key: "step_pickup" },
  { status: "stock_updated", key: "step_update" },
];

export function StatusStepper({ status }: { status: RecommendationStatus }) {
  const { t } = useApp();

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-critical-border bg-critical-bg px-3 py-2 text-xs font-semibold text-critical-text">
        <XCircle className="h-4 w-4 shrink-0" aria-hidden />
        {t("status_rejected")}
      </div>
    );
  }

  const current = STAGES.findIndex((s) => s.status === status);

  return (
    <ol className="flex items-center" aria-label="Transfer progress">
      {STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={stage.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold",
                  done && "border-healthy-border bg-healthy-bg text-healthy-text",
                  active && "border-brand-600 bg-brand-600 text-white",
                  !done && !active && "border-slate-200 bg-white text-ink-faint",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={clsx(
                  "hidden text-[10px] font-medium sm:block",
                  active ? "text-ink" : "text-ink-faint",
                )}
              >
                {t(stage.key)}
              </span>
            </div>
            {i < STAGES.length - 1 ? (
              <span
                className={clsx(
                  "mx-1 h-0.5 flex-1 rounded-full",
                  i < current ? "bg-healthy" : "bg-slate-200",
                )}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
