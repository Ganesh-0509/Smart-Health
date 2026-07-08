import { clsx } from "clsx";
import { Inbox, AlertCircle, RefreshCw } from "lucide-react";

export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  message?: string;
  icon?: typeof Inbox;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-surface-soft px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-ink-muted">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message ? <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "Retry",
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-critical-border bg-critical-bg px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-critical">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-critical-text">{title}</p>
      {message ? <p className="mt-1 max-w-sm text-sm text-critical-text/80">{message}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-critical-border bg-white px-3 py-1.5 text-sm font-medium text-critical-text hover:bg-critical-bg"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
