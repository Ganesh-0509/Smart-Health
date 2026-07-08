"use client";

import { clsx } from "clsx";
import { useApp } from "@/lib/context";

export function LanguageToggle() {
  const { lang, setLang } = useApp();
  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      <button
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={clsx(
          "rounded-md px-2.5 py-1 transition-colors",
          lang === "en" ? "bg-brand-600 text-white" : "text-ink-muted hover:text-ink",
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className={clsx(
          "rounded-md px-2.5 py-1 transition-colors",
          lang === "hi" ? "bg-brand-600 text-white" : "text-ink-muted hover:text-ink",
        )}
      >
        हिंदी
      </button>
    </div>
  );
}
