import { ChartLegend, SENTIMENT_LEGEND, SentimentLines } from "@/components/app/charts";

const trend = [
  { day: "Mon", positive: 35, neutral: 22, negative: 12 },
  { day: "Tue", positive: 48, neutral: 25, negative: 8 },
  { day: "Wed", positive: 42, neutral: 30, negative: 15 },
  { day: "Thu", positive: 65, neutral: 28, negative: 9 },
  { day: "Fri", positive: 58, neutral: 35, negative: 13 },
  { day: "Sat", positive: 32, neutral: 20, negative: 6 },
  { day: "Sun", positive: 40, neutral: 24, negative: 10 },
];

const split = [
  { label: "Positive", value: 62, color: "var(--color-chart-pos)" },
  { label: "Neutral", value: 24, color: "var(--color-chart-neu)" },
  { label: "Negative", value: 14, color: "var(--color-chart-neg)" },
];

/** Marketing preview (landing page): sample week of sentiment. */
export function SentimentChart() {
  return (
    <div className="grid gap-3 text-left md:grid-cols-[minmax(0,1fr)_260px] md:gap-4">
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-h3">Sentiment over time</h3>
            <p className="text-caption text-muted-foreground">Last 7 days · sample data</p>
          </div>
          <ChartLegend items={SENTIMENT_LEGEND} />
        </div>
        <SentimentLines data={trend} height={220} label="Sample week: positive feedback peaks on Thursday" />
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card md:p-5">
        <div>
          <h3 className="text-h3">Sentiment split</h3>
          <p className="text-caption text-muted-foreground">This week's breakdown</p>
        </div>
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
          {split.map((s) => <span key={s.label} style={{ width: `${s.value}%`, background: s.color }} />)}
        </div>
        <ul className="flex flex-col gap-2.5">
          {split.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5">
              <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
              <span className="flex-1 font-medium">{s.label}</span>
              <span className="tabular font-semibold">{s.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
