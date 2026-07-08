"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Sparkles, WifiOff } from "lucide-react";
import { api } from "@/lib/api";
import { useApp, pickLang } from "@/lib/context";
import type { AiSource, AssistantStatus } from "@/lib/types";

/** Small badge showing whether an AI answer came from live Gemini or the offline fallback. */
export function AiSourceBadge({ source }: { source: AiSource }) {
  const { t } = useApp();
  const gemini = source === "gemini";
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        gemini
          ? "border-healthy-border bg-healthy-bg text-healthy-text"
          : "border-slate-200 bg-surface-soft text-ink-muted",
      )}
    >
      {gemini ? <Sparkles className="h-3 w-3 shrink-0" aria-hidden /> : <WifiOff className="h-3 w-3 shrink-0" aria-hidden />}
      {t(gemini ? "ai_source_gemini" : "ai_source_fallback")}
    </span>
  );
}

/**
 * Live AI status pill: green "AI: Gemini live" when the backend reports mode==="live",
 * otherwise a gray "AI: offline mode". The status note is used as the tooltip.
 */
export function AiStatusBadge({ className }: { className?: string }) {
  const { t, lang } = useApp();
  const [status, setStatus] = useState<AssistantStatus | null>(null);

  useEffect(() => {
    let active = true;
    api.getAssistantStatus().then((res) => {
      if (active) setStatus(res.data);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!status) return null;
  const live = status.mode === "live";
  const note = pickLang(status, "note", lang);

  return (
    <span
      title={note}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        live
          ? "border-healthy-border bg-healthy-bg text-healthy-text"
          : "border-slate-200 bg-surface-soft text-ink-muted",
        className,
      )}
    >
      <span
        className={clsx("h-1.5 w-1.5 rounded-full", live ? "bg-healthy-text" : "bg-ink-faint")}
        aria-hidden
      />
      {t(live ? "ai_status_live" : "ai_status_offline")}
    </span>
  );
}
