"use client";

import { WifiOff } from "lucide-react";
import { useApp } from "@/lib/context";

export function OfflineBanner({ show }: { show: boolean }) {
  const { t } = useApp();
  if (!show) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-xs font-medium text-warning-text">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      {t("offline_banner")}
    </div>
  );
}
