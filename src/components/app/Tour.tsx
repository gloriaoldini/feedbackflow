import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Hash, Mail, MessageCircle, Plus, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { store, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** First-access guided tour: 5 steps. Bottom sheet on mobile, dialog elsewhere. */
export function Tour() {
  const tourDone = useApp((s) => s.tourDone);
  const name = useApp((s) => s.profileName.split(" ")[0] || "there");
  const [step, setStep] = useState(0);
  const close = () => store.set({ tourDone: true });

  const steps = [
    {
      title: (
        <>
          Welcome, <em className="serif-accent">{name}</em>
        </>
      ),
      body: "Feedback from Slack, Intercom and Gmail now lands in one inbox, tagged by sentiment, topic and urgency. Here's a one-minute tour.",
      art: <ArtSources />,
    },
    {
      title: (
        <>
          One product at a <em className="serif-accent">time</em>
        </>
      ),
      body: "Each product is a project with its own inbox, insights and Jira or Linear destination. Switch projects or workspaces from the top of the sidebar, or create one with + New project.",
      art: <ArtProjects />,
    },
    {
      title: (
        <>
          Ask your feedback <em className="serif-accent">anything</em>
        </>
      ),
      body: 'Use Ask AI at the top of the Dashboard. Try "top complaints" and you\'ll get an answer with links to the messages behind it.',
      art: <ArtAsk />,
    },
    {
      title: (
        <>
          See what to build <em className="serif-accent">next</em>
        </>
      ),
      body: "Top requests groups similar asks and ranks them by mentions. Send any of them to Jira or Linear straight from the list.",
      art: <ArtRequests />,
    },
    {
      title: (
        <>
          From feedback to <em className="serif-accent">ticket</em>
        </>
      ),
      body: "Open a message in the Inbox, check the AI summary, edit it if needed, then send it to Jira or Linear. That's the whole loop.",
      art: <ArtFlow />,
    },
  ];
  const s = steps[step];
  const last = step === steps.length - 1;

  return (
    <Dialog.Root open={!tourDone} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[oklch(0.15_0.01_40/0.55)] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex w-full flex-col overflow-hidden bg-card shadow-pop focus:outline-none",
            "inset-x-0 bottom-0 rounded-t-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-[540px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-0",
          )}
        >
          <div className="flex h-44 items-center justify-center border-b border-border bg-panel p-6 sm:h-56" aria-hidden="true">
            {s.art}
          </div>
          <div className="flex flex-col gap-2 px-5 pt-5 sm:px-7 sm:pt-6">
            <span className="text-overline text-muted-foreground">
              Step {step + 1} of {steps.length}
            </span>
            <Dialog.Title className="text-[22px] font-semibold leading-7 tracking-[-0.02em] sm:text-[24px] sm:leading-[30px]">{s.title}</Dialog.Title>
            <Dialog.Description className="text-lead text-muted-foreground">{s.body}</Dialog.Description>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-5 pb-6 pt-5 sm:px-7">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {steps.map((_, i) => (
                <span key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-5 bg-primary" : "w-2 bg-input")} />
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              {step === 0 ? (
                <Button variant="ghost" onClick={close}>
                  Skip tour
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              {last ? (
                <Button asChild>
                  <Link to="/inbox" onClick={close}>
                    Open my inbox
                  </Link>
                </Button>
              ) : (
                <Button onClick={() => setStep(step + 1)} autoFocus>
                  {step === 0 ? "Start tour" : "Next"} <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const mini = "rounded-xl border border-border bg-card shadow-pop";

function ArtSources() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-2">
        {[
          [Hash, "Slack"],
          [MessageCircle, "Intercom"],
          [Mail, "Gmail"],
        ].map(([Icon, l]) => {
          const I = Icon as typeof Hash;
          return (
            <span key={l as string} className={cn(mini, "flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium")}>
              <I className="size-4 text-muted-foreground" /> {l as string}
            </span>
          );
        })}
      </div>
      <ArrowRight className="size-5 text-primary" />
      <div className={cn(mini, "flex min-w-32 flex-col gap-0.5 px-4 py-3")}>
        <span className="text-overline text-muted-foreground">Your inbox</span>
        <span className="text-kpi">30</span>
        <span className="text-caption text-muted-foreground">signals, auto-tagged</span>
      </div>
    </div>
  );
}

function ArtProjects() {
  const rows = [
    ["W", "Web App", "bg-[oklch(0.62_0.18_25)]", true],
    ["M", "Mobile App", "bg-[oklch(0.55_0.16_295)]", false],
    ["P", "Public API", "bg-[oklch(0.57_0.14_256)]", false],
  ] as const;
  return (
    <div className={cn(mini, "flex w-full max-w-[300px] flex-col gap-0.5 p-2")}>
      <span className="px-2 py-1 text-overline text-muted-foreground">Acme Inc projects</span>
      {rows.map(([i, n, c, on]) => (
        <span key={n} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium", on && "bg-muted")}>
          <span className={cn("flex size-6 items-center justify-center rounded-md text-[11px] font-semibold text-white", c)}>{i}</span>
          <span className="flex-1">{n}</span>
          {on && <Check className="size-3.5 text-primary" />}
        </span>
      ))}
      <span className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium text-primary-ink">
        <span className="flex size-6 items-center justify-center rounded-md border border-dashed border-border-hover"><Plus className="size-3.5" /></span>
        New project
      </span>
    </div>
  );
}

function ArtAsk() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      <div className={cn(mini, "flex items-center gap-2.5 p-2 pl-3")}>
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand">
          <Sparkles className="size-3.5 text-white" />
        </span>
        <span className="flex-1 text-[13px]">Top complaints this week</span>
        <span className="rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-medium text-white">Ask AI</span>
      </div>
      <div className={cn(mini, "px-3.5 py-2.5 text-[13px] leading-5 text-muted-foreground")}>
        <b className="font-semibold text-foreground">API rate limits</b> come up in 4 negative messages, 3 marked urgent.
      </div>
    </div>
  );
}

function ArtRequests() {
  return (
    <div className={cn(mini, "flex w-full max-w-sm flex-col gap-3 px-4 py-3.5")}>
      <span className="text-overline text-muted-foreground">Top requests</span>
      {[
        ["Dark mode", 100],
        ["API rate limit increase", 75],
        ["Slack notifications", 58],
      ].map(([n, w], i) => (
        <div key={n as string} className="grid grid-cols-[14px_1fr_auto] items-center gap-2.5 text-[13px]">
          <span className="font-semibold text-ink-subtle">{i + 1}</span>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{n as string}</span>
            <span className="h-1.5 rounded-full bg-primary" style={{ width: `${w}%`, opacity: 1 - i * 0.25 }} />
          </div>
          <span className="rounded-md border border-input bg-card px-2 py-1 text-[11.5px] font-medium">Send</span>
        </div>
      ))}
    </div>
  );
}

function ArtFlow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <div className={cn(mini, "flex w-32 flex-col gap-1.5 px-3 py-2.5")}>
        <span className="text-overline text-muted-foreground">1 · Feedback</span>
        <span className="text-[12px] leading-4">"Would love a dark mode option…"</span>
      </div>
      <ArrowRight className="size-4 text-primary" />
      <div className={cn(mini, "flex w-32 flex-col gap-1.5 border-ai-bd bg-ai-bg px-3 py-2.5")}>
        <span className="text-overline text-primary-ink">2 · AI summary</span>
        <span className="text-[12px] font-medium leading-4">Requests dark mode for late-night use</span>
      </div>
      <ArrowRight className="size-4 text-primary" />
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-white">
        <Send className="size-3.5" /> Send to Jira
      </span>
    </div>
  );
}
