"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Activity, X } from "lucide-react";
import { useApp } from "@/lib/context";
import { navGroupsForRole } from "./nav-items";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { t, role } = useApp();
  const groups = role ? navGroupsForRole(role) : [];

  return (
    <>
      {/* Mobile overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Activity className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold leading-tight text-ink">
                {t("appName")}
              </span>
              <span className="block text-[10px] leading-tight text-ink-muted">
                {t("nav_group_intelligence")}
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface-soft lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.titleKey} className="mb-5">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                {t(group.titleKey)}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-50 text-brand-700"
                            : "text-ink-soft hover:bg-surface-soft hover:text-ink",
                        )}
                      >
                        <Icon
                          className={clsx("h-5 w-5 shrink-0", active ? "text-brand-600" : "text-ink-faint")}
                          aria-hidden
                        />
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <p className="text-[11px] leading-relaxed text-ink-faint">{t("appTagline")}</p>
        </div>
      </aside>
    </>
  );
}
