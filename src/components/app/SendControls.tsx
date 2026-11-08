import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Loader2, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendToTracker, undoSend } from "@/lib/data";
import { useApp, type Destination } from "@/lib/store";
import { useProjectConfig } from "@/lib/projects";
import { StatusTag } from "./primitives";

/** Full send block used in the Inbox detail (step 3 of the key flow). */
export function SendPanel({ id, disabled }: { id: string; disabled?: boolean }) {
  const sentTo = useApp((s) => s.sent[id]);
  const { connected, defaultDest: def, destKey } = useProjectConfig();
  const [busy, setBusy] = useState<Destination | null>(null);

  const send = async (dest: Destination) => {
    setBusy(dest);
    await sendToTracker("feedback", id, dest);
    setBusy(null);
    toast.success(`Sent to ${dest}`, {
      description: "Issue created with the summary and a link to the message.",
      action: { label: "Undo", onClick: () => undoSend("feedback", id) },
    });
  };

  if (sentTo) {
    return (
      <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-pos-bd bg-pos-bg px-3.5 py-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-chart-pos">
          <Check className="size-4 text-white" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-pos-strong">Sent to {sentTo}</p>
          <p className="text-caption text-pos-fg">Issue created in {destKey || sentTo} with summary and source link</p>
        </div>
        <Button variant="ghost" size="sm" className="text-pos-fg hover:bg-pos-bd/40 hover:text-pos-strong" onClick={() => undoSend("feedback", id)}>
          Undo
        </Button>
      </div>
    );
  }

  const dests: Destination[] = def === "linear" ? ["Linear", "Jira"] : ["Jira", "Linear"];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {dests.map((d, i) => {
          const isConnected = connected[d.toLowerCase() as "jira" | "linear"];
          if (!isConnected)
            return (
              <Button key={d} asChild variant="secondary">
                <Link to="/integrations">
                  <Plus /> Connect {d}
                </Link>
              </Button>
            );
          return (
            <Button key={d} variant={i === 0 ? "default" : "secondary"} disabled={disabled || !!busy} onClick={() => send(d)}>
              {busy === d ? <Loader2 className="animate-spin" /> : <Send />}
              {busy === d ? "Sending…" : `Send to ${d}`}
            </Button>
          );
        })}
        <Button asChild variant="ghost">
          <Link to="/integrations">
            <Plus /> Add integration
          </Link>
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">Creates an issue with the summary, tags and a link back to this message.</p>
    </div>
  );
}

/** Compact "Send" for ranked feature requests. Uses the default destination. */
export function SendFeatureButton({ id, name }: { id: string; name: string }) {
  const sentTo = useApp((s) => s.sentFeatures[id]);
  const cfg = useProjectConfig();
  const def = cfg.defaultDest;
  const connected = cfg.connected[def];
  const [busy, setBusy] = useState(false);
  const dest: Destination = def === "linear" ? "Linear" : "Jira";

  if (sentTo) return <StatusTag><Check className="size-3" strokeWidth={2.5} aria-hidden="true" /> In {sentTo}</StatusTag>;
  if (!connected)
    return (
      <Button asChild size="sm" variant="secondary">
        <Link to="/integrations">Connect {dest}</Link>
      </Button>
    );
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={busy}
      aria-label={`Send ${name} to ${dest}`}
      onClick={async () => {
        setBusy(true);
        await sendToTracker("feature", id, dest);
        setBusy(false);
        toast.success(`"${name}" sent to ${dest}`, { action: { label: "Undo", onClick: () => undoSend("feature", id) } });
      }}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Send />}
      <span className="hidden sm:inline">{busy ? "Sending…" : `Send to ${dest}`}</span>
      <span className="sm:hidden">Send</span>
    </Button>
  );
}

export function useSentFeatureCount() {
  return useApp((s) => Object.keys(s.sentFeatures).length);
}

