import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Hash, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { store, useApp } from "@/lib/store";
import { useWorkspace } from "@/lib/projects";
import { cn } from "@/lib/utils";

type Step = { anchor?: string; title: React.ReactNode; body: React.ReactNode; art?: React.ReactNode };

/** The first visible element marked data-tour="<name>" (sidebar, rail or mobile bar). */
function findAnchor(name: string) {
  return [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
}

function useAnchorRect(name: string | undefined, active: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!active || !name) { setRect(null); return; }
    const el = findAnchor(name);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight - 24) el.scrollIntoView({ block: r.height > window.innerHeight * 0.45 ? "start" : "center" });
    const update = () => { const e = findAnchor(name); setRect(e ? e.getBoundingClientRect() : null); };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [name, active]);
  return rect;
}

/** Puts the card next to the highlighted section: right, below, above or left, whichever fits. */
function placeCard(rect: DOMRect, w: number, h: number) {
  const gap = 16, m = 12, vw = window.innerWidth, vh = window.innerHeight;
  const clampX = (x: number) => Math.min(Math.max(x, m), vw - w - m);
  const clampY = (y: number) => Math.min(Math.max(y, m), vh - h - m);
  if (rect.width < vw * 0.4 && rect.right + gap + w <= vw - m) return { left: rect.right + gap, top: clampY(rect.top - 8), side: "left" as const };
  if (rect.bottom + gap + h <= vh - m) return { left: clampX(rect.left), top: rect.bottom + gap, side: "top" as const };
  if (rect.top - gap - h >= m) return { left: clampX(rect.left), top: rect.top - gap - h, side: "bottom" as const };
  if (rect.left - gap - w >= m) return { left: rect.left - gap - w, top: clampY(rect.top), side: "right" as const };
  return { left: clampX(rect.left), top: vh - h - m, side: null };
}

/**
 * First-access guided tour. Step 1 is a welcome dialog; every other step
 * highlights the part of the page it explains and opens right next to it.
 */
export function Tour() {
  const tourDone = useApp((s) => s.tourDone);
  const name = useApp((s) => s.profileName.split(" ")[0] || "there");
  const team = useWorkspace();
  const [step, setStep] = useState(0);
  const close = () => store.set({ tourDone: true });
  const cardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 260 });

  const steps: Step[] = [
    {
      title: <>Welcome, <em className="serif-accent">{name}</em></>,
      body: "Feedback from Slack, Intercom and Gmail lands in one inbox, tagged by sentiment, topic and urgency. Here's a one-minute tour of where things are.",
      art: <ArtSources />,
    },
    {
      anchor: "switcher",
      title: <>Your team and its <em className="serif-accent">products</em></>,
      body: (
        <>
          In capitals, your team (<b className="font-semibold text-foreground">{team.name}</b>). Below it, the product you're looking at. Click to switch to another product, such as your website, app or software, or to another team. Each product has its own inbox, insights and Jira or Linear destination.
        </>
      ),
    },
    {
      anchor: "ask",
      title: <>Ask your feedback <em className="serif-accent">anything</em></>,
      body: (
        <>
          Try "top complaints": the answer links to the messages behind it. Tip: press <kbd className="rounded border border-border bg-muted px-1 text-[12px]">⌘K</kbd> or <kbd className="rounded border border-border bg-muted px-1 text-[12px]">Ctrl K</kbd> anywhere to search messages, requests and pages.
        </>
      ),
    },
    {
      anchor: "requests",
      title: <>See what to build <em className="serif-accent">next</em></>,
      body: "Similar asks are grouped and ranked by how many customers mention them. Send one to Jira or Linear straight from here.",
    },
    {
      anchor: "recent",
      title: <>From feedback to <em className="serif-accent">ticket</em></>,
      body: "Open a message to read its AI summary, then send it to Jira or Linear. When it ships, notify everyone who asked in one click.",
    },
  ];
  const s = steps[step];
  const last = step === steps.length - 1;
  const open = !tourDone;
  const rect = useAnchorRect(s.anchor, open);

  useLayoutEffect(() => {
    if (cardRef.current) setSize({ w: cardRef.current.offsetWidth, h: cardRef.current.offsetHeight });
  }, [step, rect, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  const anchored = !!(s.anchor && rect);
  const pos = anchored ? placeCard(rect!, size.w, size.h) : null;
  const pad = 6;

  const content = (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {/* Dim everything except the highlighted section */}
      {anchored ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl transition-all duration-300 ease-out"
          style={{
            left: rect!.left - pad, top: rect!.top - pad, width: rect!.width + pad * 2, height: rect!.height + pad * 2,
            boxShadow: "0 0 0 3px oklch(0.586 0.192 20 / 0.55), 0 0 0 9999px oklch(0.15 0.01 40 / 0.55)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[oklch(0.15_0.01_40/0.55)] animate-in fade-in-0" />
      )}

      <div
        ref={cardRef}
        className={cn(
          "fixed flex flex-col overflow-hidden bg-card shadow-pop",
          anchored
            ? "w-[min(360px,calc(100vw-24px))] rounded-2xl border border-border transition-[left,top] duration-300 ease-out"
            : "inset-x-0 bottom-0 rounded-t-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[540px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
        )}
        style={pos ? { left: pos.left, top: pos.top } : undefined}
      >
        {pos?.side && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute size-3 rotate-45 border-border bg-card",
              pos.side === "left" && "-left-[7px] top-6 border-b border-l",
              pos.side === "right" && "-right-[7px] top-6 border-r border-t",
              pos.side === "top" && "-top-[7px] left-8 border-l border-t",
              pos.side === "bottom" && "-bottom-[7px] left-8 border-b border-r",
            )}
          />
        )}
        {s.art && (
          <div className="flex h-44 items-center justify-center border-b border-border bg-panel p-6 sm:h-52" aria-hidden="true">
            {s.art}
          </div>
        )}
        <div className={cn("flex flex-col gap-2", anchored ? "px-5 pt-4" : "px-5 pt-5 sm:px-7 sm:pt-6")}>
          <span className="text-overline text-muted-foreground">Step {step + 1} of {steps.length}</span>
          <h2 id="tour-title" className={cn("font-semibold tracking-[-0.02em]", anchored ? "text-[19px] leading-6" : "text-[22px] leading-7 sm:text-[24px] sm:leading-[30px]")}>{s.title}</h2>
          <p id="tour-body" className={cn("text-muted-foreground", anchored ? "text-[14px] leading-[22px]" : "text-lead")}>{s.body}</p>
        </div>
        <div className={cn("flex flex-wrap items-center gap-3", anchored ? "px-5 pb-4 pt-4" : "px-5 pb-6 pt-5 sm:px-7")}>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-5 bg-primary" : "w-2 bg-input")} />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            {step === 0 ? (
              <Button variant="ghost" onClick={close}>Skip tour</Button>
            ) : (
              <Button variant="secondary" size={anchored ? "sm" : "default"} onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {last ? (
              <Button asChild size={anchored ? "sm" : "default"}>
                <Link to="/inbox" onClick={close}>Open my inbox</Link>
              </Button>
            ) : (
              <Button size={anchored || step > 0 ? "sm" : "default"} onClick={() => setStep(step + 1)} autoFocus>
                {step === 0 ? "Start tour" : "Next"} <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(content, document.body);
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

