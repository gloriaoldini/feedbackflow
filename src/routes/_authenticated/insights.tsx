import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Download, Lightbulb, MessagesSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarList, EmptyState, KpiCard, PageHeader, SectionTitle } from "@/components/app/primitives";
import { ChartLegend, SENTIMENT_LEGEND, SentimentBars } from "@/components/app/charts";
import { SendFeatureButton } from "@/components/app/SendControls";
import { downloadCsv, sentimentSeries, useFeatures, useFeedback } from "@/lib/data";
import { TOPIC_LABEL, type FeedbackItem, type Topic } from "@/lib/demo-data";
import { useCurrentProject } from "@/lib/projects";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Insights · FeedBackFlow" }] }),
  component: InsightsPage,
});

const THEMES: Record<string, [string, number][]> = {
  web: [["Onboarding", 84], ["AI", 78], ["Performance", 67], ["Integrations", 63], ["Pricing", 52], ["Mobile", 41]],
  mobile: [["Onboarding", 72], ["Notifications", 58], ["Performance", 49], ["Offline", 38]],
  api: [["Docs", 88], ["Reliability", 61], ["Rate limits", 34], ["Webhooks", 57]],
  "insights-hub": [["Chart builder", 86], ["Sharing", 44], ["Exports", 39], ["Scheduling", 52]],
};
const healthColor = (v: number) => (v >= 70 ? "var(--color-chart-pos)" : v >= 50 ? "var(--color-chart-neu)" : "var(--color-chart-neg)");

function topTopic(items: FeedbackItem[]) {
  const counts = items.reduce<Record<string, number>>((a, i) => ({ ...a, [i.topic]: (a[i.topic] ?? 0) + 1 }), {});
  const [t, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return t ? { topic: TOPIC_LABEL[t as Topic], n } : null;
}

function InsightsPage() {
  const project = useCurrentProject();
  const { data: fb = [] } = useFeedback();
  const { data: features = [] } = useFeatures();

  const d = useMemo(() => {
    const week = sentimentSeries(fb, 7).map((r) => ({ ...r, day: new Date(r.key).toLocaleDateString("en-US", { weekday: "short" }) }));
    const pos = fb.filter((f) => f.sentiment === "positive");
    const neg = fb.filter((f) => f.sentiment === "negative");
    const neu = fb.length - pos.length - neg.length;
    const score = fb.length ? (pos.length * 5 + neu * 3 + neg.length * 1) / fb.length : 0;
    return {
      week,
      split: fb.length ? [pos.length, neu, neg.length].map((n) => Math.round((n / fb.length) * 100)) : [0, 0, 0],
      score: score.toFixed(1),
      open: fb.filter((f) => f.urgency === "high").length,
      praised: topTopic(pos),
      watch: topTopic(neg),
      negUrgent: neg.filter((f) => f.urgency === "high").length,
    };
  }, [fb]);

  const sentCount = useApp((s) => Object.keys(s.sentFeatures).filter((id) => features.some((f) => f.id === id)).length + Object.keys(s.sent).filter((id) => fb.some((f) => f.id === id)).length);
  const themes = THEMES[project.id];
  const topFeature = features[0];

  if (!fb.length) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Weekly" accent="insights" sub={project.name} />
        <Card>
          <EmptyState
            icon={MessagesSquare}
            title="No feedback yet"
            body={`Connect a source to ${project.name} and insights will appear here as messages arrive.`}
            action={<Button asChild><Link to="/integrations">Connect a source</Link></Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <PageHeader
        title="Weekly"
        accent="insights"
        sub={`AI-curated themes from ${fb.length} pieces of feedback in ${project.name}.`}
        actions={
          <Button variant="secondary" onClick={() => downloadCsv(`${project.id}-insights.csv`, [["Request", "Mentions"], ...features.map((f) => [f.topic_name, f.mention_count])])}>
            <Download /> Export CSV
          </Button>
        }
      />

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <KpiCard label="Feedback this week" value={fb.length} delta="↑ 24%" good note="vs last week" />
        <KpiCard label="Avg. sentiment" value={d.score} suffix=" / 5" delta="↑ 0.4" good note="vs last week" />
        <KpiCard label="Sent to Jira / Linear" value={sentCount} delta={sentCount ? `↑ ${sentCount}` : "→ 0"} good note="this week" />
        <KpiCard label="Urgent issues" value={d.open} delta="↓ 3" good note="vs last week" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
          <SectionTitle title="Sentiment over time" sub="Last 7 days · messages per day" actions={<ChartLegend items={SENTIMENT_LEGEND} />} />
          <SentimentBars data={d.week} height={230} label="Messages per day by sentiment, last 7 days" />
        </Card>
        <Card className="flex flex-col gap-5 p-5 md:p-6">
          <SectionTitle title="Sentiment split" sub="This week's breakdown" />
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`${d.split[0]}% positive, ${d.split[1]}% neutral, ${d.split[2]}% negative`}>
            <span style={{ width: `${d.split[0]}%`, background: "var(--color-chart-pos)" }} />
            <span style={{ width: `${d.split[1]}%`, background: "var(--color-chart-neu)" }} />
            <span style={{ width: `${d.split[2]}%`, background: "var(--color-chart-neg)" }} />
          </div>
          <ul className="flex flex-col gap-3">
            {SENTIMENT_LEGEND.map((l, i) => (
              <li key={l.label} className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-[3px]" style={{ background: l.color }} />
                <span className="flex-1 font-medium">{l.label}</span>
                <span className="tabular font-semibold">{d.split[i]}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <Card className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
          <SectionTitle title="Theme health" sub="Score out of 100 · higher means happier customers" />
          {themes ? (
            <>
              <BarList rows={themes.map(([label, value]) => ({ label, value, color: healthColor(value) }))} color="" labelWidth={104} max={100} />
              <div className="flex flex-wrap gap-3.5 text-caption text-muted-foreground">
                {[["var(--color-chart-pos)", "70+ healthy"], ["var(--color-chart-neu)", "50–69 watch"], ["var(--color-chart-neg)", "under 50 at risk"]].map(([c, l]) => (
                  <span key={l} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-[2px]" style={{ background: c }} />{l}</span>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={Lightbulb} title="Not enough data" body="Theme health appears after about 50 messages." />
          )}
        </Card>
      </section>

      <section aria-label="AI insights" className="grid gap-4 md:grid-cols-3">
        {d.praised && (
          <InsightCard tone="pos" icon={TrendingUp} title={`Customers love: ${d.praised.topic}`} body={`${d.praised.n} positive messages mention ${d.praised.topic.toLowerCase()}. Worth showcasing in your changelog.`} filter="positive" />
        )}
        {d.watch && (
          <InsightCard tone="neg" icon={AlertTriangle} title={`Watch: ${d.watch.topic} issues`} body={`${d.watch.n} negative messages, ${d.negUrgent} marked urgent. Consider escalating to the owning team.`} filter="negative" />
        )}
        {topFeature && (
          <InsightCard tone="amb" icon={Lightbulb} title={`Top ask: ${topFeature.topic_name}`} body={`${topFeature.mention_count} mentions this week and climbing. Send it to your tracker to get it on the roadmap.`} filter="all" />
        )}
      </section>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4 md:px-6 md:py-5">
          <SectionTitle title="Top feature requests" sub="Ranked by mentions across all sources" />
        </div>
        <ol className="p-2 md:p-3">
          {features.map((f, i) => (
            <li key={f.id} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg px-3 py-3 transition-colors hover:bg-background md:grid-cols-[20px_minmax(140px,220px)_minmax(0,1fr)_96px_auto] md:gap-4">
              <span className="tabular text-[13px] font-semibold text-ink-subtle">{i + 1}</span>
              <span className="truncate font-medium">{f.topic_name}</span>
              <span className="col-span-2 col-start-2 row-start-2 h-1.5 overflow-hidden rounded-full bg-muted md:col-span-1 md:col-start-auto md:row-start-auto">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(f.mention_count / (features[0]?.mention_count || 1)) * 100}%`, opacity: Math.max(0.35, 1 - i * 0.12) }} />
              </span>
              <span className="tabular hidden text-right text-caption text-muted-foreground md:block">{f.mention_count} mentions</span>
              <span className="col-start-3 row-start-1 md:col-start-auto md:row-start-auto">
                <SendFeatureButton id={f.id} name={f.topic_name} />
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function InsightCard({ tone, icon: Icon, title, body, filter }: { tone: "pos" | "neg" | "amb"; icon: React.ElementType; title: string; body: string; filter: "positive" | "negative" | "all" }) {
  const toneCls = { pos: "bg-pos-bg text-pos-fg", neg: "bg-neg-bg text-neg-fg", amb: "bg-amb-bg text-amb-fg" }[tone];
  return (
    <Card className="flex flex-col gap-3 p-5 md:p-6">
      <span className={`flex size-9 items-center justify-center rounded-[10px] ${toneCls}`}>
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <h3 className="text-h3">{title}</h3>
      <p className="text-muted-foreground">{body}</p>
      <Link to="/inbox" search={filter === "all" ? {} : { filter }} className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-primary-ink hover:underline">
        View messages <ArrowRight className="size-3.5" />
      </Link>
    </Card>
  );
}
