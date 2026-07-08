"use client";

import { useRouter } from "next/navigation";
import { Menu, MapPin, LogOut, ChevronDown, LogIn, Loader2 } from "lucide-react";
import { useApp } from "@/lib/context";
import { useAuth } from "@/lib/auth-context";
import { LanguageToggle } from "./LanguageToggle";
import { AiStatusBadge } from "./AiBadges";
import type { DictKey } from "@/lib/i18n";
import type { Role } from "@/lib/types";

const roleKey: Record<Role, DictKey> = {
  pharmacist: "role_pharmacist",
  medical_officer: "role_medical_officer",
  block_manager: "role_block_manager",
  district_officer: "role_district_officer",
  admin: "role_admin",
};

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const { t, role, setRole, phcs, phcScope, setPhcScope } = useApp();
  const { user, loading: authLoading, signInWithGoogle, signOut: authSignOut } = useAuth();
  const router = useRouter();

  function signOut() {
    setRole(null);
    router.push("/");
  }

  const initials = role ? t(roleKey[role]).slice(0, 2) : "SH";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <button
        onClick={onMenu}
        className="rounded-md p-2 text-ink-muted hover:bg-surface-soft lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* PHC scope selector */}
      <div className="relative flex items-center">
        <MapPin className="pointer-events-none absolute left-2.5 h-4 w-4 text-ink-faint" aria-hidden />
        <select
          value={phcScope ?? ""}
          onChange={(e) => setPhcScope(e.target.value || null)}
          aria-label={t("scope_label")}
          className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm font-medium text-ink hover:border-slate-300 focus:border-brand-500"
        >
          <option value="">{t("scope_all")}</option>
          {phcs.map((p) => (
            <option key={p.phc_id} value={p.phc_id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-ink-faint" aria-hidden />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Live AI status */}
        <AiStatusBadge className="hidden md:inline-flex" />

        {/* Google (Firebase) sign-in — optional, demo-friendly */}
        {user ? (
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-1.5 md:flex">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-healthy-bg text-xs font-bold uppercase text-healthy-text">
                {(user.name ?? user.email ?? "?").slice(0, 1)}
              </span>
            )}
            <div className="pr-1 text-left leading-tight">
              <p className="text-xs font-semibold text-ink">{user.name ?? t("auth_demo_user")}</p>
              {user.email ? <p className="text-[10px] text-ink-muted">{user.email}</p> : null}
            </div>
            <button
              onClick={() => authSignOut()}
              className="rounded-md p-1.5 text-ink-muted hover:bg-surface-soft hover:text-critical"
              aria-label={t("auth_sign_out")}
              title={t("auth_sign_out")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            disabled={authLoading}
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-soft disabled:opacity-60 md:inline-flex"
          >
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogIn className="h-4 w-4" aria-hidden />
            )}
            {t("auth_sign_in_google")}
          </button>
        )}

        <LanguageToggle />

        {/* Role chip + sign out */}
        <div className="hidden items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-1.5 sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-700">
            {initials}
          </span>
          <div className="pr-1 text-left leading-tight">
            <p className="text-[10px] text-ink-muted">{t("signed_in_as")}</p>
            <p className="text-xs font-semibold text-ink">
              {role ? t(roleKey[role]) : "—"}
            </p>
          </div>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-soft hover:text-critical"
            aria-label={t("switch_role")}
            title={t("switch_role")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={signOut}
          className="rounded-md p-2 text-ink-muted hover:bg-surface-soft sm:hidden"
          aria-label={t("switch_role")}
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
