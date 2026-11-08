import { Check, CircleCheckBig, Copy, GitBranch, Hash, Mail, MessageCircle, PenTool, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { ProjectRouting } from "@/lib/projects";
import type { IntegrationId } from "@/lib/store";
import { cn } from "@/lib/utils";

export const INTEGRATIONS: Record<IntegrationId, { name: string; desc: string; icon: React.ElementType; kind: "source" | "dest" | "more" }> = {
  slack: { name: "Slack", desc: "Pull feedback from the channels you choose.", icon: Hash, kind: "source" },
  intercom: { name: "Intercom", desc: "Sync conversations and tickets with a tag.", icon: MessageCircle, kind: "source" },
  gmail: { name: "Gmail", desc: "Forward customer emails to a project address.", icon: Mail, kind: "source" },
  jira: { name: "Jira", desc: "Create issues from AI summaries, with a link back to the message.", icon: Ticket, kind: "dest" },
  linear: { name: "Linear", desc: "Create Linear issues from feedback, labelled by topic.", icon: CircleCheckBig, kind: "dest" },
  github: { name: "GitHub", desc: "Open issues in any repository.", icon: GitBranch, kind: "more" },
  figma: { name: "Figma", desc: "Comment on design files with related feedback.", icon: PenTool, kind: "more" },
};

export const SLACK_CHANNELS = ["#web-feedback", "#mobile-feedback", "#customer-success", "#support", "#hub-feedback", "#beta-testers"];

export function IntegrationIcon({ id, size = 40 }: { id: IntegrationId; size?: number }) {
  const Icon = INTEGRATIONS[id].icon;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[10px] bg-muted text-ink-2" style={{ width: size, height: size }}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

export function gmailAddress(alias: string, workspaceId: string) {
  return `${alias || "project"}@${workspaceId}.feedbackflow.app`;
}

/** Routing fields for one source: which channel / tag / address feeds this project. */
export function SourceFields({
  id,
  routing,
  onChange,
  workspaceId,
}: {
  id: "slack" | "intercom" | "gmail";
  routing: ProjectRouting;
  onChange: (r: ProjectRouting) => void;
  workspaceId: string;
}) {
  if (id === "slack") {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-medium">Channels that feed this project</legend>
        <div className="flex flex-wrap gap-2">
          {SLACK_CHANNELS.map((c) => {
            const on = routing.slackChannels.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onChange({ ...routing, slackChannels: on ? routing.slackChannels.filter((x) => x !== c) : [...routing.slackChannels, c] })
                }
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:focus-ring",
                  on ? "border-primary bg-primary-soft text-primary-ink" : "border-input bg-card text-ink-2 hover:border-border-hover",
                )}
              >
                {on && <Check className="size-3.5" aria-hidden="true" />}
                {c}
              </button>
            );
          })}
        </div>
        <p className="text-caption text-muted-foreground">Messages posted in these channels are added to this project only.</p>
      </fieldset>
    );
  }
  if (id === "intercom") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ic-tag" className="text-[13px] font-medium">Intercom tag</label>
        <Input id="ic-tag" value={routing.intercomTag} onChange={(e) => onChange({ ...routing, intercomTag: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="e.g. mobile" />
        <p className="text-caption text-muted-foreground">Conversations with this tag are routed to this project.</p>
      </div>
    );
  }
  const address = gmailAddress(routing.gmailAlias, workspaceId);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="gm-alias" className="text-[13px] font-medium">Forwarding address</label>
      <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:border-primary">
        <input
          id="gm-alias"
          value={routing.gmailAlias}
          onChange={(e) => onChange({ ...routing, gmailAlias: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[14px] focus:outline-none"
          placeholder="alias"
        />
        <span className="flex items-center whitespace-nowrap border-l border-input bg-muted px-3 text-[13px] text-muted-foreground">@{workspaceId}.feedbackflow.app</span>
      </div>
      <button
        type="button"
        onClick={() => { navigator.clipboard?.writeText(address); toast.success("Address copied"); }}
        className="inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-primary-ink hover:underline"
      >
        <Copy className="size-3.5" aria-hidden="true" /> Copy {address}
      </button>
      <p className="text-caption text-muted-foreground">Set up a Gmail filter that forwards customer emails to this address.</p>
    </div>
  );
}

export function DestinationFields({ id, value, onChange }: { id: "jira" | "linear"; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-key`} className="text-[13px] font-medium">{id === "jira" ? "Jira project key" : "Linear team"}</label>
      <Input
        id={`${id}-key`}
        value={value}
        onChange={(e) => onChange(id === "jira" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) : e.target.value)}
        placeholder={id === "jira" ? "e.g. WEB" : "e.g. Mobile"}
      />
      <p className="text-caption text-muted-foreground">New issues from this project are created {id === "jira" ? "in this Jira project" : "for this Linear team"}.</p>
    </div>
  );
}
