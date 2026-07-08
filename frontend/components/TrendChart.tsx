"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

export interface SeriesDef {
  key: string;
  name: string;
  color: string;
  type?: "line" | "area";
  strokeDasharray?: string;
}

const axisProps = {
  stroke: "#94a3b8",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-ink-soft">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-ink">{p.value ?? "—"}</span>
        </p>
      ))}
    </div>
  );
}

export function TrendChart({
  data,
  xKey,
  series,
  height = 240,
  showLegend = true,
  xTickFormatter,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  showLegend?: boolean;
  xTickFormatter?: (v: string) => string;
}) {
  const hasArea = series.some((s) => s.type === "area");
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        {hasArea ? (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey={xKey} tickFormatter={xTickFormatter} {...axisProps} />
            <YAxis {...axisProps} width={40} />
            <Tooltip content={<ChartTooltip />} />
            {showLegend ? <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /> : null}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.strokeDasharray}
                fill={`url(#grad-${s.key})`}
                connectNulls
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey={xKey} tickFormatter={xTickFormatter} {...axisProps} />
            <YAxis {...axisProps} width={40} />
            <Tooltip content={<ChartTooltip />} />
            {showLegend ? <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /> : null}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.strokeDasharray}
                connectNulls
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
