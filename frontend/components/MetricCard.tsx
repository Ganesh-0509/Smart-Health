import { clsx } from "clsx";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Semantic } from "@/lib/format";

const accent: Record<Semantic | "neutral", { ring: string; icon: string; text?: string }> = {
  healthy: { ring: "bg-healthy-bg", icon: "text-healthy" },
  warning: { ring: "bg-warning-bg", icon: "text-warning" },
  critical: { ring: "bg-critical-bg", icon: "text-critical" },
  info: { ring: "bg-info-bg", icon: "text-info" },
  neutral: { ring: "bg-slate-100", icon: "text-ink-muted" },
};

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  tone?: Semantic | "neutral";
  href?: string;
}) {
  const a = accent[tone];
  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold leading-none tracking-tight text-ink">{value}</p>
        {sub ? <p className="mt-1.5 text-xs text-ink-muted">{sub}</p> : null}
      </div>
      {Icon ? (
        <span
          className={clsx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            a.ring,
          )}
        >
          <Icon className={clsx("h-5 w-5", a.icon)} aria-hidden />
        </span>
      ) : null}
    </div>
  );

  const base =
    "card p-5 transition-shadow " + (href ? "hover:shadow-card-hover" : "");
  return href ? (
    <Link href={href} className={clsx(base, "block")}>
      {inner}
    </Link>
  ) : (
    <div className={base}>{inner}</div>
  );
}
