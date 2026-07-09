"use client";

import { useCallback, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Flag, MapPin, ExternalLink, Search } from "lucide-react";
import { useApp, pickLang } from "@/lib/context";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/EmptyState";
import { pct } from "@/lib/format";
import type { PhcScore } from "@/lib/types";

// Maps Embed API key. OPTIONAL — the page degrades to keyless "open in Google
// Maps" links when it is absent (matching the app's graceful-fallback design).
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const dotColor: Record<string, string> = {
  healthy: "bg-healthy",
  warning: "bg-warning",
  critical: "bg-critical",
};

/** Keyless deep link — always free, opens the native Google Maps app/site. */
function gmapsSearchUrl(s: PhcScore): string {
  return `https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`;
}

/** Maps Embed API URL (free, no usage cap) centred on the given facility. */
function embedUrl(s: PhcScore): string {
  const q = encodeURIComponent(`${s.latitude},${s.longitude}`);
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${q}&zoom=13`;
}

export default function FacilityMapPage() {
  const { t, lang } = useApp();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fetcher = useCallback(() => api.getDistrict(lang), [lang]);
  const { data, loading, error, fromMock, reload } = useApi(fetcher, [lang]);

  const scores = useMemo(() => data?.phc_scores ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scores;
    return scores.filter((s) => s.name.toLowerCase().includes(q));
  }, [scores, query]);

  // Default selection: whatever the user picked, else the first flagged centre,
  // else the first facility in the list.
  const selected = useMemo<PhcScore | null>(() => {
    if (!scores.length) return null;
    return (
      scores.find((s) => s.phc_id === selectedId) ??
      scores.find((s) => s.flagged) ??
      scores[0]
    );
  }, [scores, selectedId]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("map_title")} subtitle={t("map_subtitle")} />
      <OfflineBanner show={fromMock} />

      {loading ? (
        <Card>
          <LoadingState rows={6} />
        </Card>
      ) : error || !data ? (
        <ErrorState
          title={t("state_error_title")}
          message={t("state_error_body")}
          onRetry={reload}
          retryLabel={t("retry")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Facility list */}
          <Card className="lg:col-span-1">
            <CardHeader title={`${t("map_facilities")} (${scores.length})`} />
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("map_search_placeholder")}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {filtered.length ? (
              <ul className="max-h-[440px] space-y-1 overflow-y-auto pr-1">
                {filtered.map((s) => {
                  const active = selected?.phc_id === s.phc_id;
                  return (
                    <li key={s.phc_id}>
                      <button
                        onClick={() => setSelectedId(s.phc_id)}
                        aria-current={active ? "true" : undefined}
                        className={clsx(
                          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
                          active
                            ? "border-brand-200 bg-brand-50"
                            : "border-transparent hover:bg-surface-soft",
                        )}
                      >
                        <span
                          className={clsx(
                            "flex h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white",
                            dotColor[s.risk_level],
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            {s.flagged ? (
                              <Flag className="h-3 w-3 shrink-0 text-critical" aria-hidden />
                            ) : null}
                            <span className="truncate text-sm font-medium text-ink">
                              {s.name}
                            </span>
                            <span className="text-[10px] uppercase text-ink-faint">
                              {s.type}
                            </span>
                          </span>
                          <span className="text-[11px] text-ink-muted">
                            {t("dist_health_score")}: {pct(s.health_score)}
                          </span>
                        </span>
                        <a
                          href={gmapsSearchUrl(s)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={t("map_open_in_gmaps")}
                          aria-label={t("map_open_in_gmaps")}
                          className="shrink-0 rounded-md p-1.5 text-ink-faint hover:bg-white hover:text-brand-600"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-1 py-6 text-center text-sm text-ink-muted">
                {t("map_no_results")}
              </p>
            )}

            {/* Legend */}
            <div className="mt-3 flex gap-3 border-t border-slate-100 pt-3 text-[11px]">
              {(["healthy", "warning", "critical"] as const).map((r) => (
                <span key={r} className="flex items-center gap-1.5">
                  <span className={clsx("h-2.5 w-2.5 rounded-full", dotColor[r])} />
                  <span className="capitalize text-ink-soft">{r}</span>
                </span>
              ))}
            </div>
          </Card>

          {/* Map / detail panel */}
          <Card className="lg:col-span-2">
            <CardHeader
              title={
                selected
                  ? `${selected.name} · ${selected.type}`
                  : t("map_title")
              }
              action={
                selected ? (
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={selected.risk_level} size="sm" />
                    <a
                      href={gmapsSearchUrl(selected)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-soft"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {t("map_open_in_gmaps")}
                    </a>
                  </div>
                ) : null
              }
            />

            {selected && MAPS_KEY ? (
              <iframe
                key={selected.phc_id}
                title={selected.name}
                src={embedUrl(selected)}
                className="h-[520px] w-full rounded-xl border border-slate-200"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              // Keyless fallback: no embed, but the page stays fully usable.
              <div className="flex h-[520px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-brand-50/30 p-6 text-center">
                <MapPin className="h-10 w-10 text-brand-400" aria-hidden />
                <div className="max-w-md space-y-1">
                  <p className="text-sm font-semibold text-ink">
                    {t("map_key_missing_title")}
                  </p>
                  <p className="text-xs text-ink-muted">{t("map_key_missing_body")}</p>
                </div>
                {selected ? (
                  <a
                    href={gmapsSearchUrl(selected)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {selected.name} · {t("map_open_in_gmaps")}
                  </a>
                ) : null}
              </div>
            )}

            {selected?.flagged ? (
              <p className="mt-3 rounded-lg bg-critical-bg px-3 py-2 text-xs text-critical-text">
                {pickLang(selected, "flag_reason", lang)}
              </p>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
