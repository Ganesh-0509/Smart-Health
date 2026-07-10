"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Activity,
  Pill,
  Stethoscope,
  Building2,
  Landmark,
  ShieldCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { ROLE_FOCUS, ROLE_HOME } from "@/lib/roles";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { Role } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

const roles: { role: Role; labelKey: DictKey; icon: LucideIcon }[] = [
  { role: "pharmacist", labelKey: "role_pharmacist", icon: Pill },
  { role: "medical_officer", labelKey: "role_medical_officer", icon: Stethoscope },
  { role: "block_manager", labelKey: "role_block_manager", icon: Building2 },
  { role: "district_officer", labelKey: "role_district_officer", icon: Landmark },
  { role: "admin", labelKey: "role_admin", icon: ShieldCheck },
];

export default function LoginPage() {
  const { t, setRole } = useApp();
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);

  function enter() {
    if (!selected) return;
    setRole(selected);
    // Each role opens on its own control view, not a shared dashboard.
    router.push(ROLE_HOME[selected]);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-brand-50 via-surface-sunken to-white">
      {/* soft grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <header className="relative flex items-center justify-between p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-bold text-ink">{t("appName")}</span>
        </div>
        <LanguageToggle />
      </header>

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 pb-16">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-healthy" />
            {t("appTagline")}
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t("login_title")}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{t("login_subtitle")}</p>
        </div>

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          role="radiogroup"
          aria-label={t("login_pick_role")}
        >
          {roles.map(({ role, labelKey, icon: Icon }) => {
            const active = selected === role;
            return (
              <button
                key={role}
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(role)}
                onDoubleClick={enter}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all",
                  active
                    ? "border-brand-500 shadow-card-hover ring-2 ring-brand-500/20"
                    : "border-slate-200 shadow-card hover:border-brand-300 hover:shadow-card-hover",
                )}
              >
                <span
                  className={clsx(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    active ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{t(labelKey)}</span>
                  <span className="block truncate text-xs text-ink-muted">
                    {t(ROLE_FOCUS[role])}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={enter}
          disabled={!selected}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("login_cta")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>

        <p className="mt-4 text-center text-xs text-ink-faint">{t("login_demo_note")}</p>
      </main>
    </div>
  );
}
