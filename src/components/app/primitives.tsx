import * as React from "react";
import { Hash, Mail, MessageCircle, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPIC_LABEL, type Sentiment, type Source, type Topic } from "@/lib/demo-data";
import { applyTheme, resolveTheme, store, useApp } from "@/lib/store";
import logoUrl from "@/assets/logo-256.png";

/* ---------- Brand ---------- */
export function Logo({ size = 28, withText = true, sub }: { size?: number; withText?: boolean; sub?: string }) {
  return (
    <span className="flex items-center gap-2">
      <img src={logoUrl} alt="" width={size} height={size} className="rounded-[8px]" style={{ width: size, height: size }} />
      {withText && (
        <span className="flex flex-col leading-tight">
          <span className="text-logo text-[15px] font-semibold tracking-[-0.01em]">FeedBackFlow</span>
          {sub && <span className="text-caption text-muted-foreground">{sub}</span>}
        </span>
      )}
    </span>
  );
}

export function Avatar({ name, size = 32, brand = false, className }: { name: string; size?: number; brand?: boolean; className?: string }) {
  const ini = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "U";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        brand ? "bg-brand text-white" : "bg-muted text-ink-2",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {brand ? ini.slice(0, 1) : ini}
    </span>
  );
}

/* ---------- Tags (fixed meanings) ---------- */
const tagBase = "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-[12px] font-medium leading-none";
const SENT: Record<Sentiment, [string, string]> = {
  positive: ["Positive", "bg-pos-bg text-pos-fg border-pos-bd"],
  neutral: ["Neutral", "bg-neu-bg text-neu-fg border-neu-bd"],
  negative: ["Negative", "bg-neg-bg text-neg-fg border-neg-bd"],
};

export function SentimentTag({ value }: { value: Sentiment }) {
  const [label, cls] = SENT[value];
  return (
    <span className={cn(tagBase, cls)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

export function TopicTag({ value }: { value: Topic }) {
  return <span className={cn(tagBase, "bg-topic-bg text-topic-fg border-topic-bd")}>{TOPIC_LABEL[value]}</span>;
}

export function UrgentTag() {
  return <span className={cn(tagBase, "border-urgent bg-urgent font-semibold text-white")}>Urgent</span>;
}

export function StatusTag({ children, tone = "pos" }: { children: React.ReactNode; tone?: "pos" | "brand" }) {
  return (
    <span className={cn(tagBase, tone === "pos" ? "bg-pos-bg text-pos-fg border-pos-bd" : "bg-primary-soft text-primary-ink border-transparent font-semibold")}>
      {children}
    </span>
  );
}

const SOURCE_ICON = { slack: Hash, intercom: MessageCircle, gmail: Mail } as const;
export function SourceIcon({ source, className }: { source: Source; className?: string }) {
  const Icon = SOURCE_ICON[source];
  return <Icon className={cn("size-4", className)} aria-label={source} />;
}

/* ---------- Layout ---------- */
export function PageHeader({
  title,
  accent,
  after,
  sub,
  overline,
  actions,
}: {
  title: string;
  accent: string;
  after?: string;
  sub?: React.ReactNode;
  overline?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
      <div className="flex min-w-0 flex-col gap-1.5">
        {overline && <span className="text-overline text-muted-foreground">{overline}</span>}
        <h1 className="text-h1-sm md:text-h1 text-balance">
          {title} <em className="serif-accent">{accent}</em>
          {after ? ` ${after}` : ""}
        </h1>
        {sub && <p className="text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-h3">{title}</h2>
        {sub && <p className="mt-0.5 text-caption text-muted-foreground">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}

/* ---------- Segmented control (filters / tabs) ---------- */
export function Segmented<T extends string>({
  value,
  onChange,
  items,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[10px] bg-muted p-[3px]", className)}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(it.value)}
            className={cn(
              "inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:focus-ring",
              on ? "bg-card text-foreground shadow-[0_1px_2px_oklch(0.2_0.02_20/0.08),0_0_0_1px_oklch(0.2_0.02_20/0.05)]" : "text-ink-3 hover:bg-card/50 hover:text-foreground",
            )}
          >
            {it.label}
            {it.count !== undefined && <span className="tabular text-[11.5px] text-ink-subtle">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Data bits ---------- */
export function Sparkline({ values, color, className }: { values: number[]; color: string; className?: string }) {
  const w = 80, h = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const d = values
    .map((v, i) => `${i ? "L" : "M"}${((i / Math.max(1, values.length - 1)) * w).toFixed(1)} ${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-7 w-20", className)} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  suffix,
  delta,
  good,
  note = "vs prior period",
  spark,
  sparkColor = "var(--primary)",
  action,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  delta: string;
  good: boolean;
  note?: string;
  spark?: number[];
  sparkColor?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:p-5">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className="text-kpi text-[26px] leading-[30px] md:text-[32px] md:leading-9">
          {value}
          {suffix && <span className="text-[18px] font-medium text-ink-subtle">{suffix}</span>}
        </span>
        {action ?? (spark && <Sparkline values={spark} color={sparkColor} className="hidden sm:block" />)}
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn("tabular text-[12px] font-semibold", good ? "text-pos-fg" : "text-neg-fg")}>{delta}</span>
        <span className="hidden text-caption text-muted-foreground sm:inline">{note}</span>
      </div>
    </div>
  );
}

export function BarList({
  rows,
  color,
  labelWidth = 104,
  max,
}: {
  rows: { label: string; value: number; color?: string }[];
  color: string;
  labelWidth?: number;
  max?: number;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="grid items-center gap-3" style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr) 32px` }}>
          <span className="truncate text-[13px] font-medium">{r.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / top) * 100}%`, background: r.color ?? color }} />
          </span>
          <span className="tabular text-right text-[13px] font-semibold">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Theme toggle (always labelled) ---------- */
export function useTheme() {
  const theme = useApp((s) => s.theme);
  const isDark = useApp((s) => resolveTheme(s.theme) === "dark");
  const setTheme = (t: "light" | "dark" | "system") => {
    store.set({ theme: t });
    applyTheme(t);
  };
  return { theme, isDark, setTheme, toggle: () => setTheme(isDark ? "light" : "dark") };
}

/** Sun / moon switch: both icons sit in the track, the thumb slides over the inactive one. */
export function ThemeSwitch({ id, labelledBy, label }: { id?: string; labelledBy?: string; label?: string }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : (label ?? "Dark mode")}
      onClick={toggle}
      className={cn(
        "relative h-7 w-[52px] shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:focus-ring",
        isDark ? "bg-[oklch(0.33_0.012_45)] shadow-[inset_0_0_0_1px_oklch(1_0_0/0.08)]" : "bg-[oklch(0.92_0.02_70)] shadow-[inset_0_0_0_1px_oklch(0.2_0.02_20/0.08)]",
      )}
    >
      <Sun className={cn("absolute left-[7px] top-[7px] z-[2] size-3.5 transition-colors", isDark ? "text-ink-subtle" : "text-[oklch(0.68_0.15_55)]")} strokeWidth={2.2} aria-hidden="true" />
      <Moon className={cn("absolute right-[7px] top-[7px] z-[2] size-3.5 transition-colors", isDark ? "text-[oklch(0.3_0.02_40)]" : "text-[oklch(0.65_0.02_40)]")} strokeWidth={2.2} aria-hidden="true" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-[3px] top-[3px] z-[1] size-[22px] rounded-full shadow-[0_1px_2px_oklch(0_0_0/0.25)] transition-transform duration-200",
          isDark ? "translate-x-6 bg-[oklch(0.95_0.011_63)]" : "translate-x-0 bg-white",
        )}
      />
    </button>
  );
}

export function ThemeToggle({ variant = "row" }: { variant?: "row" | "rail" | "header" }) {
  const id = React.useId();
  if (variant === "rail") {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        <ThemeSwitch labelledBy={`${id}-l`} />
        <span id={`${id}-l`} className="text-center text-[10px] font-medium leading-3 text-ink-3">
          Dark mode
        </span>
      </div>
    );
  }
  if (variant === "header") return <ThemeSwitch />;
  return (
    <div className="flex h-10 items-center gap-2.5 px-2.5">
      <span id={`${id}-l`} className="flex-1 text-[14px] font-medium text-ink-3">
        Dark mode
      </span>
      <ThemeSwitch labelledBy={`${id}-l`} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: React.ElementType; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-ink-2">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-h3">{title}</p>
        <p className="mt-1 max-w-xs text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  );
}
