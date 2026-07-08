import { useApp } from "@/lib/context";
import type { Confidence, RiskLevel, Urgency } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { confidenceSemantic, urgencySemantic } from "@/lib/format";
import type { DictKey } from "@/lib/i18n";

const riskKey: Record<RiskLevel, DictKey> = {
  healthy: "risk_healthy",
  warning: "risk_warning",
  critical: "risk_critical",
};

const urgencyKey: Record<Urgency, DictKey> = {
  low: "urgency_low",
  medium: "urgency_medium",
  high: "urgency_high",
  critical: "urgency_critical",
};

const confidenceKey: Record<Confidence, DictKey> = {
  high: "conf_high",
  medium: "conf_medium",
  low: "conf_low",
  very_low: "conf_very_low",
};

export function RiskBadge({ risk, size = "md" }: { risk: RiskLevel; size?: "sm" | "md" }) {
  const { t } = useApp();
  return <StatusBadge semantic={risk} label={t(riskKey[risk])} size={size} />;
}

export function UrgencyBadge({ urgency, size = "md" }: { urgency: Urgency; size?: "sm" | "md" }) {
  const { t } = useApp();
  return (
    <StatusBadge semantic={urgencySemantic(urgency)} label={t(urgencyKey[urgency])} size={size} />
  );
}

export function ConfidenceBadge({
  confidence,
  reason,
  size = "sm",
}: {
  confidence: Confidence;
  reason?: string;
  size?: "sm" | "md";
}) {
  const { t } = useApp();
  return (
    <span title={reason} className="inline-flex">
      <StatusBadge semantic={confidenceSemantic(confidence)} label={t(confidenceKey[confidence])} size={size} />
    </span>
  );
}
