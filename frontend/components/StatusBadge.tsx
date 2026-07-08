import { clsx } from "clsx";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Semantic } from "@/lib/format";

const styles: Record<Semantic, { cls: string; icon: LucideIcon }> = {
  healthy: {
    cls: "bg-healthy-bg text-healthy-text border-healthy-border",
    icon: CheckCircle2,
  },
  warning: {
    cls: "bg-warning-bg text-warning-text border-warning-border",
    icon: AlertTriangle,
  },
  critical: {
    cls: "bg-critical-bg text-critical-text border-critical-border",
    icon: AlertOctagon,
  },
  info: {
    cls: "bg-info-bg text-info-text border-info-border",
    icon: Info,
  },
};

const extraIcons = { pending: Clock, rejected: XCircle } as const;

export function StatusBadge({
  semantic,
  label,
  icon,
  size = "md",
}: {
  semantic: Semantic;
  label: string;
  icon?: "pending" | "rejected" | "none";
  size?: "sm" | "md";
}) {
  const s = styles[semantic];
  const Icon =
    icon === "pending"
      ? extraIcons.pending
      : icon === "rejected"
        ? extraIcons.rejected
        : icon === "none"
          ? null
          : s.icon;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        s.cls,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {label}
    </span>
  );
}
