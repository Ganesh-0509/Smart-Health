import { clsx } from "clsx";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  PackageX,
  CalendarClock,
  TrendingUp,
  Truck,
  BedDouble,
  UserX,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import type { AlertType, RiskLevel } from "@/lib/types";
import type { Semantic } from "@/lib/format";

const toneStyles: Record<Semantic, string> = {
  healthy: "border-healthy-border bg-healthy-bg",
  warning: "border-warning-border bg-warning-bg",
  critical: "border-critical-border bg-critical-bg",
  info: "border-info-border bg-info-bg",
};
const toneIconColor: Record<Semantic, string> = {
  healthy: "text-healthy",
  warning: "text-warning",
  critical: "text-critical",
  info: "text-info",
};
const toneText: Record<Semantic, string> = {
  healthy: "text-healthy-text",
  warning: "text-warning-text",
  critical: "text-critical-text",
  info: "text-info-text",
};

const typeIcon: Record<AlertType, LucideIcon> = {
  shortage: PackageX,
  expiry: CalendarClock,
  spike: TrendingUp,
  transfer_due: Truck,
  bed_full: BedDouble,
  doctor_absent: UserX,
  test_down: FlaskConical,
};

function riskToSemantic(r: RiskLevel): Semantic {
  return r;
}

export function AlertBanner({
  type,
  risk,
  title,
  message,
  meta,
  compact = false,
}: {
  type?: AlertType;
  risk: RiskLevel;
  title: string;
  message?: string;
  meta?: React.ReactNode;
  compact?: boolean;
}) {
  const tone = riskToSemantic(risk);
  const Icon = type ? typeIcon[type] : tone === "critical" ? AlertOctagon : tone === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={clsx(
        "flex items-start gap-3 rounded-xl border",
        toneStyles[tone],
        compact ? "p-3" : "p-4",
      )}
      role="alert"
    >
      <span className={clsx("mt-0.5 shrink-0", toneIconColor[tone])}>
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={clsx("font-semibold", toneText[tone], compact ? "text-sm" : "text-sm")}>
            {title}
          </p>
          {meta}
        </div>
        {message ? (
          <p className={clsx("mt-0.5 text-sm text-ink-soft", compact && "line-clamp-2")}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
