"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Area,
  ComposedChart,
  Line,
} from "recharts";

export const SEMANTIC_COLORS = {
  healthy: "#16a34a",
  warning: "#f59e0b",
  critical: "#dc2626",
  info: "#2563eb",
  brand: "#2563eb",
  slate: "#94a3b8",
};

function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      {label ? <p className="mb-1 font-medium text-ink">{label}</p> : null}
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-ink-soft">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color ?? p.payload?.color }}
          />
          {p.name}: <span className="font-semibold text-ink">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<MiniTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink">
          {centerValue ?? total}
        </span>
        {centerLabel ? (
          <span className="text-xs text-ink-muted">{centerLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  bars,
  height = 240,
  stacked = false,
  showLegend = true,
  layout = "horizontal",
}: {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; name: string; color: string }[];
  height?: number;
  stacked?: boolean;
  showLegend?: boolean;
  layout?: "horizontal" | "vertical";
}) {
  const vertical = layout === "vertical";
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 8, right: 8, left: vertical ? 8 : -12, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={vertical} horizontal={!vertical} />
          {vertical ? (
            <>
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey={xKey}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={110}
              />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={40} />
            </>
          )}
          <Tooltip content={<MiniTooltip />} cursor={{ fill: "#f8fafc" }} />
          {showLegend ? <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /> : null}
          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name}
              fill={b.color}
              stackId={stacked ? "a" : undefined}
              radius={stacked ? 0 : [4, 4, 0, 0]}
              maxBarSize={44}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Forecast chart: history line + predicted line + confidence band area. */
export function ForecastChart({
  data,
  height = 300,
}: {
  data: {
    date: string;
    history?: number | null;
    predicted?: number | null;
    lower?: number | null;
    band?: number | null;
  }[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<MiniTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {/* invisible base to stack the band on top of */}
          <Area
            dataKey="lower"
            stackId="band"
            stroke="none"
            fill="none"
            name="lower"
            legendType="none"
            connectNulls
          />
          <Area
            dataKey="band"
            stackId="band"
            stroke="none"
            fill="#2563eb"
            fillOpacity={0.12}
            name="Confidence band"
            connectNulls
          />
          <Line
            dataKey="history"
            name="History"
            stroke="#64748b"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            dataKey="predicted"
            name="Forecast"
            stroke="#2563eb"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
