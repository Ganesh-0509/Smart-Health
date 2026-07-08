"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles, User } from "lucide-react";
import { useApp, pickLang } from "@/lib/context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { OfflineBanner } from "@/components/OfflineBanner";
import { EmptyState } from "@/components/EmptyState";
import { AiSourceBadge, AiStatusBadge } from "@/components/AiBadges";
import type { DictKey } from "@/lib/i18n";
import type { AssistantAnswer } from "@/lib/types";

interface QaPair {
  question: string;
  answer: AssistantAnswer;
}

const EXAMPLE_KEYS: DictKey[] = ["asst_ex_1", "asst_ex_2", "asst_ex_3", "asst_ex_4"];

export default function AssistantPage() {
  const { t, lang } = useApp();
  const [input, setInput] = useState("");
  const [pairs, setPairs] = useState<QaPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromMock, setFromMock] = useState(false);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setInput("");
    try {
      const res = await api.askAssistant(q, lang);
      setPairs((prev) => [...prev, { question: q, answer: res.data }]);
      setFromMock(res.fromMock);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("asst_title")}
        subtitle={t("asst_subtitle")}
        action={<AiStatusBadge />}
      />
      <OfflineBanner show={fromMock} />

      {/* Example questions */}
      <Card className="p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          {t("asst_examples")}
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => setInput(t(k))}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-soft disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              {t(k)}
            </button>
          ))}
        </div>
      </Card>

      {/* Conversation */}
      {pairs.length === 0 && !loading ? (
        <EmptyState title={t("asst_empty_title")} message={t("asst_empty_body")} icon={Sparkles} />
      ) : (
        <div className="space-y-4">
          {pairs.map((p, i) => (
            <div key={i} className="space-y-3">
              {/* Question */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <User className="h-4 w-4" aria-hidden />
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-surface-soft px-4 py-2.5 text-sm text-ink">
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                    {t("asst_you")}
                  </p>
                  {p.question}
                </div>
              </div>

              {/* Answer */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <Card className="min-w-0 flex-1 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                      {t("asst_title")}
                    </span>
                    <AiSourceBadge source={p.answer.source} />
                  </div>
                  <p className="whitespace-pre-line text-sm text-ink-soft">
                    {pickLang(p.answer, "answer", lang)}
                  </p>
                  <p className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-ink-muted">
                    {t("asst_grounded_on")}: {p.answer.grounding.flagged_centres} {t("asst_g_flagged")},{" "}
                    {p.answer.grounding.critical_items} {t("asst_g_critical")},{" "}
                    {p.answer.grounding.open_transfers} {t("asst_g_transfers")}
                  </p>
                </Card>
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("asst_thinking")}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="sticky bottom-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("asst_input_placeholder")}
          aria-label={t("asst_title")}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {t("asst_send")}
        </button>
      </form>
    </div>
  );
}
