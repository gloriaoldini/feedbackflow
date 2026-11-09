import { useMemo, useState } from "react";
import { BellRing, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFeatures, useFeedback } from "@/lib/data";
import { askersOf, featureFor, SOURCE_LABEL, type FeedbackItem } from "@/lib/demo-data";
import { store, useApp } from "@/lib/store";
import { Avatar, SourceIcon, StatusTag } from "./primitives";

/** Customers who asked for the same thing as a message or a ranked request. */
export function useAskers(target: { feedbackId?: string; featureId?: string }) {
  const { data: items = [] } = useFeedback();
  const { data: features = [] } = useFeatures();
  return useMemo(() => {
    if (target.featureId) {
      const f = features.find((x) => x.id === target.featureId);
      return { feature: f, askers: f ? askersOf(f, items) : [] };
    }
    const item = items.find((i) => i.id === target.feedbackId);
    if (!item) return { feature: undefined, askers: [] as FeedbackItem[] };
    const f = featureFor(item, features);
    return { feature: f, askers: f ? askersOf(f, items) : [item] };
  }, [items, features, target.featureId, target.feedbackId]);
}

/**
 * Close the loop: once a request ships, tell every customer who asked,
 * on the channel they used (Slack, Intercom or email).
 */
export function ShipButton({ feedbackId, featureId, compact }: { feedbackId?: string; featureId?: string; compact?: boolean }) {
  const key = featureId ? `fr:${featureId}` : `fb:${feedbackId}`;
  const notified = useApp((s) => s.shipped[key]);
  const { feature, askers } = useAskers({ feedbackId, featureId });
  const [open, setOpen] = useState(false);
  const name = feature?.topic_name ?? "your request";
  const [msg, setMsg] = useState("");

  if (notified !== undefined)
    return (
      <StatusTag tone="brand">
        <BellRing className="size-3" aria-hidden="true" /> Shipped · {notified} notified
      </StatusTag>
    );

  const openDialog = () => {
    setMsg(`Good news: we just shipped ${name}! Thanks for asking for it. Your feedback helped us decide what to build next.`);
    setOpen(true);
  };
  const channels = [...new Set(askers.map((a) => SOURCE_LABEL[a.source]))];

  return (
    <>
      <Button size="sm" variant={compact ? "ghost" : "secondary"} onClick={openDialog} aria-label={`Mark ${name} as shipped and notify customers`}>
        <Rocket /> {compact ? <span className="hidden sm:inline">Shipped?</span> : "Mark as shipped"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tell customers it shipped</DialogTitle>
            <DialogDescription>
              {askers.length} {askers.length === 1 ? "customer" : "customers"} asked for {name}. Each gets a reply on the channel they used.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-xl border border-border p-1.5">
            {askers.map((a) => (
              <li key={a.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                <Avatar name={a.author} size={26} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{a.author}</span>
                <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                  <SourceIcon source={a.source} className="size-3" /> {SOURCE_LABEL[a.source]}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ship-msg" className="text-[13px] font-medium">Message</label>
            <Textarea id="ship-msg" value={msg} onChange={(e) => setMsg(e.target.value)} className="min-h-24 text-[14px]" />
            <p className="text-caption text-muted-foreground">Each reply starts with the customer's first name.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!msg.trim() || !askers.length}
              onClick={() => {
                store.set((s) => ({ shipped: { ...s.shipped, [key]: askers.length } }));
                setOpen(false);
                toast.success(`${askers.length} ${askers.length === 1 ? "customer" : "customers"} notified`, {
                  description: `Sent via ${channels.join(", ")}.`,
                  action: { label: "Undo", onClick: () => store.set((s) => { const { [key]: _, ...rest } = s.shipped; return { shipped: rest }; }) },
                });
              }}
            >
              <BellRing /> Notify {askers.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
