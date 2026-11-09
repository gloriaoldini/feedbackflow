import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Inbox, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarList,
  EmptyState,
  KpiCard,
  PageHeader,
  SectionTitle,
  SentimentTag,
  Skeleton,
  SourceIcon,
  TopicTag,
  UrgentTag,
} from "@/components/app/primitives";
import { ChartLegend, SENTIMENT_LEGEND, SentimentBars } from "@/components/app/charts";
import { SendFeatureButton, useSentFeatureCount } from "@/components/app/SendControls";
import { Tour } from "@/components/app/Tour";
import { sentimentSeries, useFeatures, useFeedback } from "@/lib/data";
import { TOPIC_LABEL, timeAgo, type FeedbackItem } from "@/lib/demo-data";
import { useApp } from "@/lib/store";
import { useCurrentProject } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · FeedBackFlow" }] }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
}

const DAY = 86_400_000;
function windowed(items: FeedbackItem[], fromDays: number, toDays: number) {
  const now = Date.now();
  return items.filter((i) => {
    const age = now - new Date(i.created_at).getTime();
    return age >= fromDays * DAY && age < toDays * DAY;
  });
}
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const signed = (n: number, unit = "") => `${n > 0 ? "↑" : n < 0 ? "↓" : "→"} ${Math.abs(n)}${unit}`;

function Dashboard() {
  const name = useApp((s) => s.profileName.split(" ")[0] || "there");
  const { data: fb = [], isLoading } = useFeedback();
  const { data: features = [] } = useFeatures();
  const sentCount = useSentFeatureCount();
  const project = useCurrentProject();

  const stats = useMemo(() => {
    const cur = windowed(fb, 0, 7);
    const prev = windowed(fb, 7, 14);
    const share = (arr: FeedbackItem[], s: string) => pct(arr.filter((f) => f.sentiment === s).length, arr.length);
    const urgent = (arr: FeedbackItem[]) => arr.filter((f) => f.urgency === "high").length;
    const series = sentimentSeries(fb, 14);
    return {
      total: fb.length,
      pos: pct(fb.filter((f) => f.sentiment === "positive").length, fb.length),
      neg: pct(fb.filter((f) => f.sentiment === "negative").length, fb.length),
      urgent: urgent(fb),
      dTotal: prev.length ? Math.round(((cur.length - prev.length) / prev.length) * 100) : 0,
      dPos: share(cur, "positive") - share(prev, "positive"),
      dNeg: share(cur, "negative") - share(prev, "negative"),
      dUrgent: urgent(cur) - urgent(prev),
      series,
      byTopic: Object.entries(
        fb.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f.topic]: (acc[f.topic] ?? 0) + 1 }), {}),
      )
        .map(([k, v]) => ({ label: TOPIC_LABEL[k as keyof typeof TOPIC_LABEL], value: v }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    };
  }, [fb]);

  const top = features.slice(0, 3);
  const maxMentions = top[0]?.mention_count ?? 1;

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <Tour />
      <PageHeader overline={`Good ${greeting()}, ${name}`} title="What would you like to" accent="understand" after="today?" />

      <AskAI items={fb} />

      {!isLoading && fb.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title={`Waiting for ${project.name}'s first feedback`}
            body="Messages appear here a few minutes after you connect a source. Check your channels, tags or forwarding address in Integrations."
            action={<Button asChild><Link to="/integrations">Open integrations</Link></Button>}
          />
        </Card>
      ) : (<>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px]" />)}
        </div>
      ) : (
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <KpiCard label="Total feedback" value={stats.total} delta={signed(stats.dTotal, "%")} good={stats.dTotal >= 0} note="vs previous 7 days"
            spark={stats.series.map((d) => d.positive + d.neutral + d.negative)} />
          <KpiCard label="Positive sentiment" value={`${stats.pos}%`} delta={signed(stats.dPos, " pts")} good={stats.dPos >= 0} note="vs previous 7 days"
            spark={stats.series.map((d) => d.positive)} sparkColor="var(--color-chart-pos)" />
          <KpiCard label="Negative sentiment" value={`${stats.neg}%`} delta={signed(stats.dNeg, " pts")} good={stats.dNeg <= 0} note="vs previous 7 days"
            spark={stats.series.map((d) => d.negative)} sparkColor="var(--color-chart-neg)" />
          <KpiCard label="Urgent issues" value={stats.urgent} delta={signed(stats.dUrgent)} good={stats.dUrgent <= 0} note="vs previous 7 days"
            action={<Button asChild size="sm" variant="secondary"><Link to="/inbox" search={{ filter: "urgent" }}>Review</Link></Button>} />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
          <SectionTitle title="Sentiment trend" sub="Last 14 days · messages per day" actions={<ChartLegend items={SENTIMENT_LEGEND} />} />
          {isLoading ? <Skeleton className="h-60" /> : <SentimentBars data={stats.series} height={240} label="Messages per day by sentiment, last 14 days" />}
        </Card>

        <Card className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
          <SectionTitle
            title="Top requests"
            sub={`From ${stats.total} signals`}
            actions={<span className="tabular rounded-full border border-topic-bd bg-topic-bg px-2 py-0.5 text-[12px] font-medium text-topic-fg">{sentCount} sent</span>}
          />
          <ol className="-mx-3 flex flex-col">
            {top.map((f, i) => (
              <li key={f.id} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-background">
                <span className="tabular text-[13px] font-semibold text-ink-subtle">{i + 1}</span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium">{f.topic_name}</span>
                    <span className="tabular shrink-0 text-caption text-muted-foreground">{f.mention_count}</span>
                  </div>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${(f.mention_count / maxMentions) * 100}%`, opacity: 1 - i * 0.22 }} />
                  </span>
                </div>
                <SendFeatureButton id={f.id} name={f.topic_name} />
              </li>
            ))}
          </ol>
          <Link to="/insights" className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-primary-ink hover:underline">
            View all requests <ArrowRight className="size-3.5" />
          </Link>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6 md:py-5">
          <SectionTitle title="Recent feedback" sub="Live from Slack, Intercom & Gmail" />
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/integrations"><Plus /> Add source</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/inbox">Open inbox</Link>
            </Button>
          </div>
        </div>
        <ul>
          {fb.slice(0, 8).map((f) => (
            <li key={f.id} className="border-b border-muted last:border-0">
              <Link
                to="/inbox"
                search={{ id: f.id }}
                className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 px-5 py-3.5 transition-colors hover:bg-background focus-visible:outline-none focus-visible:bg-background md:grid-cols-[28px_140px_minmax(0,1fr)_auto_44px] md:items-center md:gap-4 md:px-6"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <SourceIcon source={f.source} className="size-3.5" />
                </span>
                <span className="truncate font-medium">{f.author}</span>
                <span className="tabular text-right text-caption text-muted-foreground md:hidden">{timeAgo(f.created_at)}</span>
                <span className="col-start-2 col-end-4 line-clamp-2 text-ink-3 md:col-auto md:line-clamp-1 md:text-muted-foreground">{f.original_text}</span>
                <span className="col-start-2 col-end-4 flex flex-wrap gap-1.5 md:col-auto md:justify-end">
                  <SentimentTag value={f.sentiment} />
                  <TopicTag value={f.topic} />
                  {f.urgency === "high" && <UrgentTag />}
                </span>
                <span className="tabular hidden text-right text-caption text-muted-foreground md:block">{timeAgo(f.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-5 p-5 md:p-6">
        <SectionTitle title="By topic" sub="What customers talk about in this project" />
        <BarList rows={stats.byTopic} color="var(--color-chart-topic)" labelWidth={118} />
      </Card>
      </>)}
    </div>
  );
}

/* ---------- Ask AI (rule-based in demo mode) ---------- */
function answerFor(q: string, items: FeedbackItem[]) {
  const s = q.toLowerCase();
  const neg = items.filter((i) => i.sentiment === "negative");
  if (/complain|negative|unhappy|problem/.test(s)) {
    const byTopic = neg.reduce<Record<string, FeedbackItem[]>>((a, i) => ({ ...a, [i.topic]: [...(a[i.topic] ?? []), i] }), {});
    const [topic, list] = Object.entries(byTopic).sort((a, b) => b[1].length - a[1].length)[0] ?? [];
    if (!topic) return { text: "No complaints in this period.", refs: [] };
    return {
      text: `${neg.length} negative messages. The biggest theme is ${TOPIC_LABEL[topic as keyof typeof TOPIC_LABEL].toLowerCase()} (${list.length}), led by API rate limits: ${list.filter((i) => i.urgency === "high").length} of them are urgent.`,
      refs: list.slice(0, 4),
    };
  }
  if (/request|impact|feature|build/.test(s)) {
    const fr = items.filter((i) => i.is_feature_request);
    return {
      text: `${fr.length} messages are feature requests. Dark mode, higher API limits and Slack alerts are mentioned most; API limits carry the most urgency.`,
      refs: fr.filter((i) => i.urgency !== "low").slice(0, 4),
    };
  }
  if (/churn|cancel|risk|urgent|leave/.test(s)) {
    const risk = neg.filter((i) => i.urgency === "high");
    return {
      text: `${risk.length} customers show churn signals: negative and urgent. Billing errors and blocking bugs are the most at risk.`,
      refs: risk.slice(0, 4),
    };
  }
  const words = s.split(/\W+/).filter((w) => w.length > 3);
  const hits = items.filter((i) => words.some((w) => i.original_text.toLowerCase().includes(w)));
  return hits.length
    ? { text: `${hits.length} message${hits.length > 1 ? "s" : ""} mention "${q}".`, refs: hits.slice(0, 4) }
    : { text: `No messages mention "${q}" yet. Try "top complaints" or "churn signals".`, refs: [] };
}

function AskAI({ items }: { items: FeedbackItem[] }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<{ q: string; text: string; refs: FeedbackItem[] } | null>(null);
  const [thinking, setThinking] = useState(false);

  const ask = (query: string) => {
    if (!query.trim()) return;
    setQ(query);
    setThinking(true);
    setTimeout(() => {
      setAnswer({ q: query, ...answerFor(query, items) });
      setThinking(false);
    }, 600);
  };

  return (
    <section aria-label="Ask AI" className="rounded-2xl bg-[linear-gradient(120deg,oklch(0.82_0.09_5),oklch(0.83_0.09_40)_50%,oklch(0.88_0.09_75))] p-px shadow-[0_8px_24px_-12px_oklch(0.586_0.192_20/0.3)]">
      <div className="flex flex-col gap-3 rounded-[15px] bg-card p-3 md:p-4">
        <form
          className="flex items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
        >
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand sm:flex">
            <Sparkles className="size-[18px] text-white" aria-hidden="true" />
          </span>
          <label htmlFor="ask-ai" className="sr-only">Ask AI about your feedback</label>
          <input
            id="ask-ai"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask anything about your feedback…"
            className="h-10 min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-ink-subtle focus:outline-none"
          />
          <Button type="submit" disabled={thinking || !q.trim()}>
            <Sparkles className="sm:hidden" /> {thinking ? "Thinking…" : "Ask AI"}
          </Button>
        </form>
        <div className="flex flex-wrap items-center gap-2 sm:pl-12">
          <span className="text-caption text-muted-foreground">Try</span>
          {["Top complaints", "Requests by impact", "Churn signals"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="h-7 rounded-full border border-border bg-background px-2.5 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-border-hover hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:focus-ring"
            >
              {s}
            </button>
          ))}
        </div>
        {(thinking || answer) && (
          <div aria-live="polite" className="rounded-xl border border-ai-bd bg-ai-bg p-4 animate-fade-up">
            {thinking ? (
              <div className="flex flex-col gap-2">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            ) : (
              answer && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-overline text-primary-ink">AI answer · “{answer.q}”</p>
                    <button onClick={() => setAnswer(null)} aria-label="Close answer" className="-m-1 rounded p-1 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="text-lead font-medium">{answer.text}</p>
                  {answer.refs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {answer.refs.map((r) => (
                        <Link
                          key={r.id}
                          to="/inbox"
                          search={{ id: r.id }}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[12.5px] hover:border-border-hover"
                        >
                          <SourceIcon source={r.source} className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">{r.author}</span>
                          <span className="hidden max-w-48 truncate text-muted-foreground sm:inline">{r.summary}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
