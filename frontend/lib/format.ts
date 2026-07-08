import type { Confidence, Lang, RiskLevel, Urgency } from "./types";

export function pct(v: number, digits = 0): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export function num(v: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(v));
}

export function inr(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function shortDate(iso: string, lang: Lang = "en"): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function timeAgo(iso: string, lang: Lang = "en"): string {
  const now = new Date("2026-07-08T10:00:00Z").getTime();
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((now - then) / 60000));
  if (mins < 60) return lang === "hi" ? `${mins} मिनट पहले` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return lang === "hi" ? `${hrs} घंटे पहले` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return lang === "hi" ? `${days} दिन पहले` : `${days}d ago`;
}

// Map a risk / urgency to a semantic bucket used for color + icon.
export type Semantic = "healthy" | "warning" | "critical" | "info";

export function riskSemantic(risk: RiskLevel): Semantic {
  return risk;
}

export function urgencySemantic(u: Urgency): Semantic {
  if (u === "critical" || u === "high") return "critical";
  if (u === "medium") return "warning";
  return "info";
}

export function scoreSemantic(score: number): Semantic {
  if (score >= 0.7) return "healthy";
  if (score >= 0.55) return "warning";
  return "critical";
}

// Data-confidence colour semantics: high=green, medium=blue, low=amber, very_low=red.
export function confidenceSemantic(c: Confidence): Semantic {
  if (c === "high") return "healthy";
  if (c === "medium") return "info";
  if (c === "low") return "warning";
  return "critical";
}
