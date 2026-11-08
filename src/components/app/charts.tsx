import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";

/**
 * Charts read colors from CSS variables, so they follow light / dark mode.
 * (The old charts used hsl(var(--x)) on oklch tokens, which is invalid.)
 */
const AXIS = { stroke: "var(--color-ink-subtle)", fontSize: 11, tickLine: false, axisLine: false } as const;

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-[12px] shadow-pop">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 capitalize text-ink-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}
          <span className="tabular ml-auto pl-4 font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-[12px] text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export const SENTIMENT_LEGEND = [
  { label: "Positive", color: "var(--color-chart-pos)" },
  { label: "Neutral", color: "var(--color-chart-neu)" },
  { label: "Negative", color: "var(--color-chart-neg)" },
];

export function SentimentLines({
  data,
  xKey = "day",
  height = 240,
  label = "Sentiment over time",
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  height?: number;
  label?: string;
}) {
  return (
    <div style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fbf-pos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-pos)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--color-chart-pos)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} minTickGap={24} />
          <YAxis {...AXIS} allowDecimals={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border-hover)" }} />
          <Area type="monotone" dataKey="positive" stroke="none" fill="url(#fbf-pos)" legendType="none" tooltipType="none" />
          <Line type="monotone" dataKey="neutral" stroke="var(--color-chart-neu)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="negative" stroke="var(--color-chart-neg)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="positive" stroke="var(--color-chart-pos)" strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Stacked bars per day: reads well even when a day has only a few messages. */
export function SentimentBars({ data, xKey = "day", height = 240, label = "Messages per day by sentiment" }: { data: Record<string, string | number>[]; xKey?: string; height?: number; label?: string }) {
  return (
    <div style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -18, right: 8, top: 8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} minTickGap={16} />
          <YAxis {...AXIS} allowDecimals={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
          <Bar dataKey="positive" stackId="s" fill="var(--color-chart-pos)" />
          <Bar dataKey="neutral" stackId="s" fill="var(--color-chart-neu)" />
          <Bar dataKey="negative" stackId="s" fill="var(--color-chart-neg)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NpsLine({ data, height = 200 }: { data: { week: string; nps: number }[]; height?: number }) {
  return (
    <div style={{ height }} role="img" aria-label={`NPS by week: ${data.map((d) => `${d.week} ${d.nps}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -18, right: 16, top: 20, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis dataKey="week" {...AXIS} />
          <YAxis {...AXIS} domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border-hover)" }} />
          <Line
            type="monotone"
            dataKey="nps"
            name="NPS"
            stroke="var(--color-primary)"
            strokeWidth={2.25}
            dot={{ r: 3.5, stroke: "var(--color-primary)", strokeWidth: 2, fill: "var(--color-card)" }}
            activeDot={{ r: 5 }}
          >
            <LabelList dataKey="nps" position="top" offset={10} style={{ fill: "var(--color-ink-2)", fontSize: 11, fontWeight: 600 }} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
