import { clsx } from "clsx";
import type { Semantic } from "@/lib/format";

const barColor: Record<Semantic, string> = {
  healthy: "bg-healthy",
  warning: "bg-warning",
  critical: "bg-critical",
  info: "bg-info",
};

export function ProgressBar({
  value,
  tone = "info",
  className,
  height = "h-2",
}: {
  value: number; // 0..1
  tone?: Semantic;
  className?: string;
  height?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={clsx("w-full overflow-hidden rounded-full bg-slate-100", height, className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx("h-full rounded-full transition-all", barColor[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
