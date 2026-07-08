"use client";

import { useState } from "react";
import {
  MessageSquare,
  Upload,
  Loader2,
  Smartphone,
  ScanLine,
  Signal,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/lib/context";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ConfidenceBadge } from "@/components/RiskBadge";
import type { CsvIngestResult, SmsIngestResult } from "@/lib/types";
import { shortDate } from "@/lib/format";

const DEFAULT_SMS = "STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A";
const DEFAULT_CSV =
  "phc_id,medicine_id,stock_qty,batch_no,expiry_date,snapshot_date\n" +
  "PHC-01,MED-01,180,B2455,2026-09-15,2026-07-08\n" +
  "PHC-02,MED-03,540,B7781,2026-07-29,2026-07-08\n" +
  "PHC-05,MED-08,60,B9012,2026-08-17,2026-07-08";

export default function IngestPage() {
  const { t, lang } = useApp();

  const [sms, setSms] = useState(DEFAULT_SMS);
  const [smsResult, setSmsResult] = useState<SmsIngestResult | null>(null);
  const [smsMock, setSmsMock] = useState(false);
  const [smsBusy, setSmsBusy] = useState(false);

  const [csv, setCsv] = useState(DEFAULT_CSV);
  const [csvResult, setCsvResult] = useState<CsvIngestResult | null>(null);
  const [csvMock, setCsvMock] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);

  async function sendSms() {
    setSmsBusy(true);
    try {
      const res = await api.ingestSms({ message: sms });
      setSmsResult(res.data);
      setSmsMock(res.fromMock);
    } finally {
      setSmsBusy(false);
    }
  }

  async function uploadCsv() {
    setCsvBusy(true);
    try {
      const res = await api.ingestCsv({ csv });
      setCsvResult(res.data);
      setCsvMock(res.fromMock);
    } finally {
      setCsvBusy(false);
    }
  }

  const tiers = [
    {
      icon: ScanLine,
      title: t("ing_tier_app"),
      desc: t("ing_tier_app_desc"),
      box: "bg-healthy-bg border-healthy-border",
      head: "text-healthy-text",
      body: "text-healthy-text/80",
    },
    {
      icon: Smartphone,
      title: t("ing_tier_smartphone"),
      desc: t("ing_tier_smartphone_desc"),
      box: "bg-info-bg border-info-border",
      head: "text-info-text",
      body: "text-info-text/80",
    },
    {
      icon: Signal,
      title: t("ing_tier_sms"),
      desc: t("ing_tier_sms_desc"),
      box: "bg-warning-bg border-warning-border",
      head: "text-warning-text",
      body: "text-warning-text/80",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("ing_title")} subtitle={t("ing_subtitle")} />
      <OfflineBanner show={smsMock || csvMock} />

      {/* Digital maturity tiers */}
      <Card>
        <CardHeader title={t("ing_tiers_title")} subtitle={t("ing_tiers_desc")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div key={tier.title} className={`rounded-xl border p-3 ${tier.box}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${tier.head}`}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {tier.title}
                </div>
                <p className={`mt-1 text-xs ${tier.body}`}>{tier.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SMS simulator */}
        <Card className="flex flex-col gap-4">
          <CardHeader title={t("ing_sms_title")} subtitle={t("ing_sms_desc")} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">{t("ing_sms_input")}</span>
            <textarea
              value={sms}
              onChange={(e) => setSms(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-ink focus:border-brand-500 focus:outline-none"
            />
          </label>
          <div className="rounded-lg bg-surface-soft px-3 py-2 text-xs text-ink-muted">
            <p className="font-semibold text-ink-soft">{t("ing_sms_formats")}</p>
            <p className="mt-1 font-mono">STOCK PHC-03 ORS 120 EXP 2026-12 BATCH ORS24A</p>
            <p className="font-mono">PHC-05 Paracetamol 300 09-2026</p>
          </div>
          <button
            onClick={sendSms}
            disabled={smsBusy || !sms.trim()}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {smsBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageSquare className="h-4 w-4" aria-hidden />}
            {t("ing_sms_send")}
          </button>

          {smsResult ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <CheckCircle2 className="h-4 w-4 text-healthy" aria-hidden />
                  {t("ing_sms_result")}
                </p>
                <ConfidenceBadge confidence={smsResult.data_confidence} size="sm" />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <Row label={t("ing_field_phc")} value={smsResult.phc_id} />
                <Row label={t("ing_field_medicine")} value={smsResult.medicine_name} />
                <Row label={t("ing_field_qty")} value={String(smsResult.stock_qty)} />
                <Row label={t("ing_field_batch")} value={smsResult.batch_no} />
                <Row label={t("ing_field_expiry")} value={shortDate(smsResult.expiry_date, lang)} />
                <Row label={t("updated_via_label")} value={smsResult.updated_via} />
              </dl>
              <p className="mt-3 rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-text">
                {lang === "hi" ? smsResult.note_hi : smsResult.note_en}
              </p>
            </div>
          ) : null}
        </Card>

        {/* CSV upload */}
        <Card className="flex flex-col gap-4">
          <CardHeader title={t("ing_csv_title")} subtitle={t("ing_csv_desc")} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-muted">{t("ing_csv_input")}</span>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-ink focus:border-brand-500 focus:outline-none"
            />
          </label>
          <button
            onClick={uploadCsv}
            disabled={csvBusy || !csv.trim()}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {csvBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
            {t("ing_csv_upload")}
          </button>

          {csvResult ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <CheckCircle2 className="h-4 w-4 text-healthy" aria-hidden />
                  {csvResult.inserted} {t("ing_csv_inserted")}
                </p>
                <ConfidenceBadge confidence={csvResult.data_confidence} size="sm" />
              </div>
              {csvResult.errors.length > 0 ? (
                <div className="rounded-lg bg-critical-bg px-3 py-2 text-xs text-critical-text">
                  <p className="font-semibold">{csvResult.errors.length} {t("ing_csv_errors")}</p>
                  <ul className="mt-1 list-disc pl-4">
                    {csvResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">
                  {t("updated_via_label")}: {csvResult.updated_via}
                </p>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-50 py-0.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
