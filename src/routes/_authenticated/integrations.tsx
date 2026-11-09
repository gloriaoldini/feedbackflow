import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusTag } from "@/components/app/primitives";
import { DestinationFields, INTEGRATIONS, IntegrationIcon, SourceFields, gmailAddress } from "@/components/app/SourceConfig";
import { setProjectConfig, useCurrentProject, useProjectConfig, useWorkspace, type ProjectRouting } from "@/lib/projects";
import type { IntegrationId } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrations · FeedBackFlow" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const project = useCurrentProject();
  const workspace = useWorkspace();
  const cfg = useProjectConfig();
  const [editing, setEditing] = useState<IntegrationId | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const sources = (["slack", "intercom", "gmail"] as const);
  const onSources = sources.filter((s) => cfg.connected[s]);

  const routeLabel = (id: IntegrationId) => {
    if (!cfg.connected[id]) return null;
    if (id === "slack") return cfg.routing.slackChannels.join(", ") || "No channels yet";
    if (id === "intercom") return cfg.routing.intercomTag ? `Tag: ${cfg.routing.intercomTag}` : "All conversations";
    if (id === "gmail") return gmailAddress(cfg.routing.gmailAlias, workspace.id);
    if (id === "jira" || id === "linear") return cfg.destKey && cfg.defaultDest === id ? `${id === "jira" ? "Project" : "Team"}: ${cfg.destKey}` : null;
    return null;
  };

  const card = (id: IntegrationId, featured = false) => {
    const meta = INTEGRATIONS[id];
    const on = cfg.connected[id];
    const isDefault = cfg.defaultDest === id;
    const route = routeLabel(id);
    return (
      <Card key={id} className={cn("flex flex-col gap-3.5 p-5 transition-colors hover:border-border-hover", featured && "md:p-6")}>
        <div className="flex items-center gap-3">
          <IntegrationIcon id={id} size={featured ? 44 : 40} />
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-h3", featured && "text-[16px]")}>{meta.name}</h3>
            <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", on ? "text-pos-fg" : "text-ink-subtle")}>
              <span className="size-[7px] rounded-full bg-current" aria-hidden="true" />
              {on ? "Connected" : "Not connected"}
            </span>
          </div>
          {(id === "jira" || id === "linear") && on && isDefault && <StatusTag tone="brand">Default</StatusTag>}
        </div>
        <p className="text-muted-foreground">{meta.desc}</p>
        {route && <p className="truncate rounded-lg bg-muted px-3 py-2 text-[12.5px] text-ink-2" title={route}>{route}</p>}
        <div className="mt-auto flex flex-wrap gap-2">
          {on ? (
            <>
              <Button size="sm" variant="secondary" onClick={() => setEditing(id)}>Manage</Button>
              {(id === "jira" || id === "linear") && !isDefault && (
                <Button size="sm" variant="ghost" onClick={() => { setProjectConfig(project.id, { defaultDest: id }); toast.success(`${meta.name} is now the default for ${project.name}`); }}>
                  Set as default
                </Button>
              )}
            </>
          ) : (
            <Button size={featured ? "default" : "sm"} variant={featured ? "default" : "secondary"} onClick={() => setEditing(id)}>
              Connect {meta.name}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-up md:gap-9">
      <PageHeader title="Your" accent="integrations" sub={`Where ${project.name} feedback comes from, and where its requests go.`} />

      <Card className="-mt-3 p-4 md:p-5" aria-label="Feedback flow for this product">
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          <FlowBox over="Sources" title={`${onSources.length} of 3 connected`} sub={onSources.map((s) => INTEGRATIONS[s].name).join(", ") || "None yet"} />
          <ArrowRight className="size-5 shrink-0 self-center text-ink-subtle max-md:rotate-90" aria-hidden="true" />
          <FlowBox over="FeedBackFlow AI" title="Tags, groups & summarizes" sub="Sentiment, topic and urgency" ai />
          <ArrowRight className="size-5 shrink-0 self-center text-ink-subtle max-md:rotate-90" aria-hidden="true" />
          <FlowBox
            over="Default destination"
            title={cfg.connected[cfg.defaultDest] ? `${INTEGRATIONS[cfg.defaultDest].name}${cfg.destKey ? ` · ${cfg.destKey}` : ""}` : "Not set"}
            sub='Used by every "Send" button in this project'
          />
        </div>
      </Card>

      <Section title="Sources" sub="Where customer feedback comes from">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sources.map((s) => card(s))}</div>
      </Section>

      <Section title="Send requests to" sub="Turn AI summaries into issues in one click">
        <div className="grid gap-4 md:grid-cols-2">{(["jira", "linear"] as const).map((d) => card(d, true))}</div>
      </Section>

      <Section title="More destinations" sub="Share feedback with engineering and design">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(["github", "figma"] as const).map((d) => card(d))}
          <div className="flex flex-col items-start justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-input p-5">
            <h3 className="text-h3">Missing a tool?</h3>
            <p className="text-muted-foreground">Tell us which integration would help your team most.</p>
            <Button variant="ghost" size="sm" className="-ml-2.5" onClick={() => setRequestOpen(true)}>
              <Plus /> Request an integration
            </Button>
          </div>
        </div>
      </Section>

      {editing && <ConfigureDialog id={editing} onClose={() => setEditing(null)} />}
      <RequestDialog open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-h2">{title}</h2>
        <p className="text-caption text-muted-foreground">{sub}</p>
      </div>
      {children}
    </section>
  );
}

function FlowBox({ over, title, sub, ai }: { over: string; title: string; sub: string; ai?: boolean }) {
  return (
    <div className={cn("flex flex-1 flex-col gap-0.5 rounded-xl px-4 py-3", ai ? "border border-ai-bd bg-ai-bg" : "bg-background")}>
      <span className={cn("text-overline", ai ? "text-primary-ink" : "text-muted-foreground")}>{over}</span>
      <span className="font-semibold">{title}</span>
      <span className="truncate text-caption text-muted-foreground">{sub}</span>
    </div>
  );
}

function ConfigureDialog({ id, onClose }: { id: IntegrationId; onClose: () => void }) {
  const project = useCurrentProject();
  const workspace = useWorkspace();
  const cfg = useProjectConfig();
  const meta = INTEGRATIONS[id];
  const on = cfg.connected[id];
  const [routing, setRouting] = useState<ProjectRouting>(cfg.routing);
  const [destKey, setDestKey] = useState(cfg.defaultDest === id ? cfg.destKey : "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, on ? 200 : 700)); // demo: simulated OAuth
    const isDest = id === "jira" || id === "linear";
    setProjectConfig(project.id, {
      connected: { ...cfg.connected, [id]: true },
      routing,
      ...(isDest && destKey ? { destKey, defaultDest: id } : {}),
      ...(isDest && !cfg.connected[cfg.defaultDest] ? { defaultDest: id } : {}),
    });
    setBusy(false);
    toast.success(on ? `${meta.name} settings saved` : `${meta.name} connected to ${project.name}`);
    onClose();
  };

  const disconnect = () => {
    setProjectConfig(project.id, { connected: { ...cfg.connected, [id]: false } });
    toast(`${meta.name} disconnected from ${project.name}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <IntegrationIcon id={id} />
            <div>
              <DialogTitle>{on ? `Manage ${meta.name}` : `Connect ${meta.name}`}</DialogTitle>
              <DialogDescription>For the {project.name} project</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {id === "slack" || id === "intercom" || id === "gmail" ? (
          <SourceFields id={id} routing={routing} onChange={setRouting} workspaceId={workspace.id} />
        ) : id === "jira" || id === "linear" ? (
          <DestinationFields id={id} value={destKey} onChange={setDestKey} />
        ) : (
          <p className="text-muted-foreground">You'll be asked to authorize FeedBackFlow in {meta.name}.</p>
        )}
        <DialogFooter className="mt-2 sm:items-center">
          {on && (
            <Button variant="destructive" className="sm:mr-auto" onClick={disconnect}>Disconnect</Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Connecting…" : on ? "Save" : `Connect ${meta.name}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tool, setTool] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request an integration</DialogTitle>
          <DialogDescription>Which tool should FeedBackFlow connect to next?</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success(`Thanks! We've noted your request for ${tool}.`);
            setTool("");
            onClose();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="req-tool" className="text-[13px] font-medium">Tool name</label>
            <Input id="req-tool" value={tool} onChange={(e) => setTool(e.target.value)} placeholder="e.g. Zendesk, HubSpot, Discord" autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!tool.trim()}>Send request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
