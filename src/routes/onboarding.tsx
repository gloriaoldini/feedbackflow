import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Logo, ThemeToggle } from "@/components/app/primitives";
import { INTEGRATIONS, IntegrationIcon } from "@/components/app/SourceConfig";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/data";
import { DEMO_PROJECTS, projectConfig, setProjectConfig } from "@/lib/projects";
import { store, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome · FeedBackFlow" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined" || isDemoMode()) return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  component: OnboardingPage,
});

const TOPICS = ["feature request", "bug", "UX", "pricing", "docs", "performance", "billing", "security"];
const SOURCES = ["slack", "intercom", "gmail"] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const projectId = useApp((s) => s.projectId) || "web";
  const project = DEMO_PROJECTS.find((p) => p.id === projectId) ?? DEMO_PROJECTS[0];
  const savedTopics = useApp((s) => s.topics);
  const [step, setStep] = useState(1);
  const [connected, setConnected] = useState<Set<string>>(() => new Set(SOURCES.filter((s) => projectConfig(project.id).connected[s])));
  const [topics, setTopics] = useState<Set<string>>(() => new Set(savedTopics));
  const [progress, setProgress] = useState(0);
  const done = progress >= 100;

  useEffect(() => {
    if (step !== 3) return;
    setProgress(0);
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 2200) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: ["#D63A4A", "#F06A45", "#F7A93B", "#2E9D61"] });
      }
    }, 30);
    return () => clearInterval(id);
  }, [step]);

  const toggle = (set: Set<string>, v: string) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    return next;
  };

  const finish = () => {
    const cfg = projectConfig(project.id);
    setProjectConfig(project.id, { connected: { ...cfg.connected, ...Object.fromEntries(SOURCES.map((s) => [s, connected.has(s)])) } });
    store.set({ onboarded: true, tourDone: false, topics: [...topics], projectId: project.id });
    navigate({ to: "/dashboard" });
  };
  const skip = () => {
    store.set({ onboarded: true, tourDone: false });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-panel">
      <header className="flex h-16 items-center justify-between px-5 md:px-10">
        <Logo />
        <div className="flex items-center gap-3">
          {step < 3 && <Button variant="ghost" size="sm" onClick={skip}>Skip setup</Button>}
          <ThemeToggle variant="header" />
        </div>
      </header>

      <main className="mx-auto flex max-w-[640px] flex-col gap-6 px-4 pb-16 pt-4 md:pt-10">
        <ol className="flex items-center justify-center gap-2" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-center gap-2" aria-current={n === step ? "step" : undefined}>
              <span className={cn("flex size-7 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                n < step ? "bg-primary text-white" : n === step ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                {n < step ? <Check className="size-3.5" aria-hidden="true" /> : n}
              </span>
              {n < 3 && <span className={cn("h-0.5 w-10 rounded", n < step ? "bg-primary" : "bg-input")} />}
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-pop md:p-10">
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div className="text-center">
                <h1 className="text-h1-sm md:text-h1">Connect your <em className="serif-accent">first source</em></h1>
                <p className="mt-2 text-muted-foreground">Feedback will flow into <b className="font-semibold text-foreground">{project.name}</b>, your first product. Connect at least one source to continue.</p>
              </div>
              <div className="flex flex-col gap-3">
                {SOURCES.map((s) => {
                  const on = connected.has(s);
                  return (
                    <div key={s} className={cn("flex items-center gap-4 rounded-xl border p-4 transition-colors", on ? "border-pos-bd bg-pos-bg/40" : "border-border")}>
                      <IntegrationIcon id={s} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{INTEGRATIONS[s].name}</p>
                        <p className="text-caption text-muted-foreground">{INTEGRATIONS[s].desc}</p>
                      </div>
                      <Button size="sm" variant={on ? "secondary" : "default"} onClick={() => setConnected(toggle(connected, s))} aria-pressed={on}>
                        {on ? <><Check className="text-pos-fg" /> Connected</> : "Connect"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 animate-fade-up">
              <div className="text-center">
                <h1 className="text-h1-sm md:text-h1">What <em className="serif-accent">topics</em> matter to you?</h1>
                <p className="mt-2 text-muted-foreground">We'll auto-tag incoming feedback. Pick at least one, and change them anytime.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Topics">
                {TOPICS.map((t) => {
                  const on = topics.has(t);
                  return (
                    <button key={t} onClick={() => setTopics(toggle(topics, t))} aria-pressed={on}
                      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:focus-ring",
                        on ? "border-topic-bd bg-topic-bg text-topic-fg" : "border-input bg-card text-ink-2 hover:border-border-hover")}>
                      {on && <Check className="size-3.5" aria-hidden="true" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-6 text-center animate-fade-up">
              <div>
                <h1 className="text-h1-sm md:text-h1">You're <em className="serif-accent">all set</em></h1>
                <p className="mt-2 text-muted-foreground" aria-live="polite">
                  {done ? "Your first batch of feedback is ready." : "We're analyzing your first batch of feedback…"}
                </p>
              </div>
              <div className="w-full max-w-sm">
                <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-primary transition-[width] duration-100" style={{ width: `${progress}%` }} />
                </div>
                <p className="tabular mt-2 text-caption text-muted-foreground">{Math.round(progress)}%</p>
              </div>
              {done && (
                <Button size="lg" onClick={finish} className="animate-fade-up">
                  <Sparkles /> Go to dashboard
                </Button>
              )}
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}><ArrowLeft /> Back</Button>
            <Button size="lg" onClick={() => setStep((s) => s + 1)} disabled={(step === 1 && connected.size === 0) || (step === 2 && topics.size === 0)}>
              Continue <ArrowRight />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
