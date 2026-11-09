import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Archive, CheckCheck, ChevronLeft, CornerUpLeft, Inbox as InboxIcon, Layers, Pencil, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, EmptyState, PageHeader, Segmented, SentimentTag, Skeleton, SourceIcon, TopicTag, UrgentTag } from "@/components/app/primitives";
import { SendPanel } from "@/components/app/SendControls";
import { useFeatures, useFeedback } from "@/lib/data";
import { askersOf, featureFor, SOURCE_LABEL, TOPIC_LABEL, timeAgo, timeAgoLong, type FeedbackItem, type Source, type Topic } from "@/lib/demo-data";
import { store, toggleIn, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "urgent", "negative", "positive", "favourite", "archived"] as const;
type Filter = (typeof FILTERS)[number];

export const Route = createFileRoute("/_authenticated/inbox")({
  validateSearch: z.object({
    id: z.string().optional(),
    filter: z.enum(FILTERS).optional(),
  }),
  head: () => ({ meta: [{ title: "Inbox · FeedBackFlow" }] }),
  component: InboxPage,
});

const LABELS: Record<Filter, string> = { all: "All", urgent: "Urgent", negative: "Negative", positive: "Positive", favourite: "Favourite", archived: "Archived" };

function InboxPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/inbox" });
  const filter: Filter = search.filter ?? "all";
  const { data: items = [], isLoading } = useFeedback();
  const { data: features = [] } = useFeatures();
  const groupSize = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of items) { const f = featureFor(it, features); if (f) m[it.id] = askersOf(f, items).length; }
    return m;
  }, [items, features]);
  const favourites = useApp((s) => s.favourites);
  const archived = useApp((s) => s.archived);
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const matches = (f: Filter, it: FeedbackItem) => {
    const isArch = archived.includes(it.id);
    if (f === "archived") return isArch;
    if (isArch) return false;
    if (f === "urgent") return it.urgency === "high";
    if (f === "negative" || f === "positive") return it.sentiment === f;
    if (f === "favourite") return favourites.includes(it.id);
    return true;
  };

  const refined = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (!q || `${it.author} ${it.original_text} ${it.summary}`.toLowerCase().includes(q)) &&
        (!sources.length || sources.includes(it.source)) &&
        (!topics.length || topics.includes(it.topic)),
    );
  }, [items, query, sources, topics]);

  const shown = refined.filter((it) => matches(filter, it));
  const active = shown.find((i) => i.id === search.id) ?? items.find((i) => i.id === search.id) ?? shown[0];
  const urgentCount = items.filter((i) => i.urgency === "high").length;
  const activeFilters = sources.length + topics.length;

  const select = (id?: string) => navigate({ search: (p) => ({ ...p, id }) });

  return (
    <div className="flex flex-col gap-5 animate-fade-up md:gap-6">
      <div className={cn("flex flex-col gap-5 md:gap-6", search.id && "max-md:hidden")}>
        <PageHeader
          title="Your"
          accent="inbox"
          sub={<span className="tabular">{items.length} signals · {urgentCount} urgent</span>}
          actions={
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
                <label htmlFor="inbox-search" className="sr-only">Search feedback</label>
                <input
                  id="inbox-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search feedback…"
                  className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-[14px] placeholder:text-ink-subtle hover:border-border-hover focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_oklch(0.586_0.192_20/0.15)]"
                />
              </div>
              <FilterMenu sources={sources} setSources={setSources} topics={topics} setTopics={setTopics} count={activeFilters} />
            </div>
          }
        />
        <Segmented
          label="Filter feedback"
          value={filter}
          onChange={(f) => navigate({ search: { filter: f === "all" ? undefined : f } })}
          items={FILTERS.map((f) => ({ value: f, label: LABELS[f], count: refined.filter((it) => matches(f, it)).length }))}
        />
      </div>

      <div className="grid gap-4 md:h-[calc(100vh-250px)] md:min-h-[560px] md:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        {/* List */}
        <Card className={cn("flex min-h-0 flex-col overflow-hidden", search.id && "max-md:hidden")} aria-label="Feedback list">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="tabular text-caption font-medium text-muted-foreground">{shown.length} messages</span>
            <span className="text-caption text-muted-foreground">Newest first</span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
            {isLoading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="m-1 h-24" />)}
            {!isLoading && shown.length === 0 && (
              <EmptyState
                icon={InboxIcon}
                title="Nothing here"
                body={query || activeFilters ? "No messages match your search or filters." : `No ${LABELS[filter].toLowerCase()} messages yet.`}
                action={(query || activeFilters > 0) && (
                  <Button variant="secondary" size="sm" onClick={() => { setQuery(""); setSources([]); setTopics([]); }}>Clear filters</Button>
                )}
              />
            )}
            {shown.map((it) => {
              const isActive = active?.id === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => select(it.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-1.5 rounded-[10px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:focus-ring",
                    isActive ? "md:border-sel-bd md:bg-sel-bg border-transparent" : "border-transparent hover:bg-background",
                  )}
                >
                  <span className="flex w-full items-center gap-2">
                    <span className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <SourceIcon source={it.source} className="size-3" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{it.author}</span>
                    {favourites.includes(it.id) && <Star className="size-3.5 fill-chart-neu text-chart-neu" aria-label="Favourite" />}
                    {it.urgency === "high" && <span className="size-[7px] rounded-full bg-primary" aria-label="Urgent" />}
                    <span className="tabular text-caption text-muted-foreground">{timeAgo(it.created_at)}</span>
                  </span>
                  <span className="line-clamp-2 text-[13px] leading-5 text-ink-3">{it.original_text}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <SentimentTag value={it.sentiment} />
                    <TopicTag value={it.topic} />
                    {(groupSize[it.id] ?? 0) > 1 && (
                      <span className="inline-flex h-[22px] items-center gap-1 rounded-full border border-border bg-muted px-2 text-[12px] font-medium text-ink-3">
                        <Layers className="size-3" aria-hidden="true" /> +{groupSize[it.id] - 1} similar
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Detail */}
        <Card className={cn("min-h-0 overflow-y-auto", !search.id && "max-md:hidden")} aria-label="Feedback detail">
          {active ? <Detail key={active.id} item={active} onBack={() => select(undefined)} onOpen={(id) => select(id)} /> : (
            <EmptyState icon={InboxIcon} title="Select a message" body="Pick a message to see its AI summary and send it to your tracker." />
          )}
        </Card>
      </div>
    </div>
  );
}

function FilterMenu({ sources, setSources, topics, setTopics, count }: {
  sources: Source[]; setSources: (s: Source[]) => void; topics: Topic[]; setTopics: (t: Topic[]) => void; count: number;
}) {
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <SlidersHorizontal /> <span className="hidden sm:inline">Filters</span>
          {count > 0 && <span className="tabular rounded-md bg-primary-soft px-1.5 text-[11px] font-semibold text-primary-ink">{count}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-xl border-border p-4 shadow-pop">
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-overline text-muted-foreground">Source</legend>
            {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2.5 text-[14px]">
                <Checkbox checked={sources.includes(s)} onCheckedChange={() => setSources(toggle(sources, s))} />
                <SourceIcon source={s} className="text-muted-foreground" /> {SOURCE_LABEL[s]}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-overline text-muted-foreground">Topic</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TOPIC_LABEL) as Topic[]).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2 text-[13.5px]">
                  <Checkbox checked={topics.includes(t)} onCheckedChange={() => setTopics(toggle(topics, t))} />
                  {TOPIC_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>
          <Button variant="ghost" size="sm" className="self-start" disabled={!count} onClick={() => { setSources([]); setTopics([]); }}>
            Clear all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Step({ n, tone, label, children, last }: { n: React.ReactNode; tone: "ink" | "brand" | "todo" | "done"; label: React.ReactNode; children: React.ReactNode; last?: boolean }) {
  const badge = {
    ink: "bg-foreground text-background",
    brand: "bg-brand text-white",
    todo: "bg-card text-muted-foreground shadow-[inset_0_0_0_1px_var(--color-border-hover)]",
    done: "bg-chart-pos text-white",
  }[tone];
  return (
    <li className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <span className={cn("flex size-6 items-center justify-center rounded-full text-[12px] font-semibold", badge)}>{n}</span>
        {!last && <span className="my-1 w-px flex-1 bg-input" />}
      </div>
      <div className={cn("flex min-w-0 flex-col gap-2.5", !last && "pb-6")}>
        <div className="flex min-h-6 items-center justify-between gap-2">{label}</div>
        {children}
      </div>
    </li>
  );
}

function Detail({ item, onBack, onOpen }: { item: FeedbackItem; onBack: () => void; onOpen: (id: string) => void }) {
  const fav = useApp((s) => s.favourites.includes(item.id));
  const isArchived = useApp((s) => s.archived.includes(item.id));
  const addressed = useApp((s) => s.addressed.includes(item.id));
  const edited = useApp((s) => s.summaries[item.id]);
  const sentTo = useApp((s) => s.sent[item.id]);
  const summary = edited ?? item.summary;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(summary);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [replied, setReplied] = useState(false);

  useEffect(() => setDraft(summary), [summary]);

  const iconBtn = (pressed: boolean) => cn("text-muted-foreground", pressed && "bg-primary-soft text-primary-ink hover:bg-primary-soft hover:text-primary-ink");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-7">
      <Button variant="ghost" size="sm" className="-mb-2 -ml-2 self-start md:hidden" onClick={onBack}>
        <ChevronLeft /> All messages
      </Button>

      <div className="flex items-start gap-3">
        <Avatar name={item.author} size={40} />
        <div className="min-w-0 flex-1">
          <h2 className="text-h2">{item.author}</h2>
          <p className="text-caption text-muted-foreground">{SOURCE_LABEL[item.source]} · {timeAgoLong(item.created_at)}</p>
        </div>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" aria-label={fav ? "Remove from favourites" : "Add to favourites"} aria-pressed={fav} title="Favourite" className={iconBtn(fav)} onClick={() => toggleIn("favourites", item.id)}>
            <Star className={cn(fav && "fill-current")} />
          </Button>
          <Button variant="ghost" size="icon" aria-label={isArchived ? "Unarchive" : "Archive"} aria-pressed={isArchived} title="Archive" className={iconBtn(isArchived)}
            onClick={() => { toggleIn("archived", item.id); toast(isArchived ? "Moved back to inbox" : "Archived", { action: { label: "Undo", onClick: () => toggleIn("archived", item.id) } }); }}>
            <Archive />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Mark as addressed" aria-pressed={addressed} title="Mark as addressed" className={iconBtn(addressed)} onClick={() => toggleIn("addressed", item.id)}>
            <CheckCheck />
          </Button>
        </div>
      </div>

      <div className="-mt-2 flex flex-wrap gap-1.5">
        <SentimentTag value={item.sentiment} />
        <TopicTag value={item.topic} />
        {item.urgency === "high" && <UrgentTag />}
        {addressed && <span className="inline-flex h-[22px] items-center rounded-full border border-border bg-muted px-2 text-[12px] font-medium text-ink-3">Addressed</span>}
      </div>

      <ol className="flex flex-col">
        <Step n={1} tone="ink" label={<span className="text-overline text-muted-foreground">Feedback</span>}>
          <blockquote className="rounded-xl border border-muted bg-background px-4 py-3.5 text-lead">{item.original_text}</blockquote>
          {replied && <p className="text-caption text-pos-fg">✓ Reply sent via {SOURCE_LABEL[item.source]}</p>}
          {replying ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="reply" className="sr-only">Reply to {item.author}</label>
              <Textarea id="reply" autoFocus value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${item.author.split(" ")[0]} on ${SOURCE_LABEL[item.source]}…`} className="min-h-20 text-[14px]" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setReplying(false)}>Cancel</Button>
                <Button variant="secondary" size="sm" disabled={!reply.trim()}
                  onClick={() => { setReplying(false); setReply(""); setReplied(true); toast.success(`Reply sent to ${item.author}`); }}>
                  Send reply
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" className="self-start" onClick={() => setReplying(true)}>
              <CornerUpLeft /> Reply
            </Button>
          )}
        </Step>

        <Step
          n={<Sparkles className="size-3.5" aria-hidden="true" />}
          tone="brand"
          label={
            <>
              <span className="text-overline text-primary-ink">AI summary</span>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil /> Edit
                </Button>
              )}
            </>
          }
        >
          <div className="flex flex-col gap-3 rounded-xl border border-ai-bd bg-ai-bg px-4 py-3.5">
            {editing ? (
              <>
                <label htmlFor="summary" className="sr-only">Edit AI summary</label>
                <Textarea id="summary" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setDraft(summary); setEditing(false); }}>Cancel</Button>
                  <Button variant="secondary" size="sm"
                    onClick={() => { store.set((s) => ({ summaries: { ...s.summaries, [item.id]: draft.trim() || item.summary } })); setEditing(false); toast.success("Summary saved"); }}>
                    Save summary
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-lead font-medium">{summary}</p>
            )}
            <p className="text-caption text-muted-foreground">
              {edited !== undefined ? "Edited by you · used as the issue description" : "Generated from this message · edit before sending if needed"}
            </p>
          </div>
          <SameRequest item={item} onOpen={onOpen} />
        </Step>

        <Step n={sentTo ? "✓" : 3} tone={sentTo ? "done" : "todo"} last label={<span className="text-overline text-muted-foreground">Send to your tracker</span>}>
          <SendPanel id={item.id} disabled={editing} />
        </Step>
      </ol>
    </div>
  );
}

/** Duplicate grouping: other customers who asked for the same thing. */
function SameRequest({ item, onOpen }: { item: FeedbackItem; onOpen: (id: string) => void }) {
  const { data: items = [] } = useFeedback();
  const { data: features = [] } = useFeatures();
  const feature = featureFor(item, features);
  if (!feature) return null;
  const others = askersOf(feature, items).filter((i) => i.id !== item.id);
  if (!others.length) return null;
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border px-4 py-3.5">
      <p className="flex items-center gap-2 text-[13px]">
        <Layers className="size-4 text-ink-subtle" aria-hidden="true" />
        <span>
          Same request as <b className="font-semibold">{others.length} other {others.length === 1 ? "customer" : "customers"}</b> · <span className="text-muted-foreground">{feature.topic_name}</span>
        </span>
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {others.map((o) => (
          <li key={o.id}>
            <button onClick={() => onOpen(o.id)} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-card pl-1 pr-2.5 text-[12.5px] font-medium hover:border-border-hover hover:bg-hover focus-visible:outline-none focus-visible:focus-ring">
              <Avatar name={o.author} size={20} />
              {o.author}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
