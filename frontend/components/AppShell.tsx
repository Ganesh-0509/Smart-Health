"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { role, ready } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Redirect to login if no role selected (after hydration).
  useEffect(() => {
    if (ready && !role) router.replace("/");
  }, [ready, role, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      </div>
    );
  }

  if (!role) return null;

  return (
    <div className="flex min-h-screen bg-surface-sunken">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
