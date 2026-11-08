import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheckBig, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProjectMark } from "@/components/app/ProjectSwitcher";
import { DestinationFields, INTEGRATIONS, IntegrationIcon, SourceFields, gmailAddress } from "@/components/app/SourceConfig";
import { COLOR_CLASS, PROJECT_COLORS, WORKSPACES, createProject, emptyConfig, slugify, useWorkspace, type ProjectConfig } from "@/lib/projects";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({ meta: [{ title: "New project · FeedBackFlow" }] }),
  component: NewProject,
});

const STEPS = ["Project", "Sources", "Destination", "Done"];

function NewProject() {
  const navigate = useNavigate();
  const current = useWorkspace();
  const names = useApp((s) => s.workspaceNames);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>("amber");
  const [workspaceId, setWorkspaceId] = useState(current.id);
  const [cfg, setCfg] = useState<ProjectConfig>(() => emptyConfig());
  const [openSource, setOpenSource] = useState<"slack" | "intercom" | "gmail" | null>("slack");
  const [created, setCreated] = useState(false);

  const alias = slugify(name);
  const routing = { ...cfg.routing, gmailAlias: cfg.routing.gmailAlias || alias };
  const sourcesOn = (["slack", "intercom", "gmail"] as const).filter((s) => cfg.connected[s]);
  const canNext = step === 0 ? name.trim().length > 1 : true;

  const finish = () => {
    createProject({ name: name.trim(), description: description.trim() || undefined, color, workspaceId }, { ...cfg, routing });
    setCreated(true);
    setStep(3);
    toast.success(`${name.trim()} created`);
  };

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/dashboard"><ArrowLeft /> Cancel</Link>
        </Button>
        <span className="text-caption text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
      </div>

      <header className="flex flex-col gap-1.5">
        <h1 className="text-h1-sm md:text-h1">
          {step === 3 ? <>You're <em className="serif-accent">ready</em></> : <>New <em className="serif-accent">project</em></>}
        </h1>
        <p className="text-muted-foreground">
          {step === 3 ? "Feedback will start flowing into this project within a few minutes." : "A project is one product, with its own inbox, insights and Jira or Linear destination."}
        </p>
      </header>

      <ol className="grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-col gap-2" aria-current={i === step ? "step" : undefined}>
            <span className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
            <span className={cn("text-[12px] font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
              {i < step ? "✓ " : ""}{s}
            </span>
          </li>
        ))}
      </ol>

      <Card className="p-5 md:p-7">
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <ProjectMark project={{ name: name || "?", color }} size={48} />
              <div className="flex-1">
                <p className="text-h3">{name || "Project name"}</p>
                <p className="text-caption text-muted-foreground">{names[workspaceId] ?? WORKSPACES.find((w) => w.id === workspaceId)?.name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-name" className="text-[13px] font-medium">Project name</label>
              <Input id="p-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Checkout, Mobile App, Admin Portal" maxLength={40} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-desc" className="text-[13px] font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Input id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this product?" maxLength={80} />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-medium">Color</legend>
              <div className="flex flex-wrap gap-2.5">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={color === c}
                    onClick={() => setColor(c)}
                    className={cn("flex size-9 items-center justify-center rounded-lg text-white ring-offset-2 ring-offset-card focus-visible:outline-none focus-visible:focus-ring", COLOR_CLASS[c], color === c && "ring-2 ring-foreground")}
                  >
                    {color === c && <Check className="size-4" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[13px] font-medium">Workspace</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {WORKSPACES.map((w) => (
                  <label key={w.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors", workspaceId === w.id ? "border-primary bg-primary-soft/50" : "border-input hover:border-border-hover")}>
                    <input type="radio" name="ws" className="accent-[var(--color-primary)]" checked={workspaceId === w.id} onChange={() => setWorkspaceId(w.id)} />
                    <span className="flex-1 font-medium">{names[w.id] ?? w.name}</span>
                    <span className="text-caption text-muted-foreground">{w.plan}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-h2">Connect sources</h2>
              <p className="text-muted-foreground">Choose where {name}'s feedback comes from. Each source can feed several projects through its own channels, tags or address.</p>
            </div>
            {(["slack", "intercom", "gmail"] as const).map((s) => {
              const on = cfg.connected[s];
              const open = openSource === s;
              return (
                <div key={s} className={cn("rounded-xl border transition-colors", on ? "border-pos-bd" : "border-border")}>
                  <div className="flex items-center gap-3 p-3.5">
                    <IntegrationIcon id={s} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{INTEGRATIONS[s].name}</p>
                      <p className="truncate text-caption text-muted-foreground">
                        {on
                          ? s === "slack" ? routing.slackChannels.join(", ") || "Pick channels below"
                            : s === "intercom" ? (routing.intercomTag ? `Tag: ${routing.intercomTag}` : "All conversations")
                            : gmailAddress(routing.gmailAlias, workspaceId)
                          : INTEGRATIONS[s].desc}
                      </p>
                    </div>
                    {on ? (
                      <Button size="sm" variant="ghost" onClick={() => setOpenSource(open ? null : s)}>{open ? "Done" : "Edit"}</Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => { setCfg({ ...cfg, connected: { ...cfg.connected, [s]: true } }); setOpenSource(s); }}>
                        Connect
                      </Button>
                    )}
                  </div>
                  {on && open && (
                    <div className="border-t border-border p-4">
                      <SourceFields id={s} routing={routing} workspaceId={workspaceId} onChange={(r) => setCfg({ ...cfg, routing: r })} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-h2">Where should requests go?</h2>
              <p className="text-muted-foreground">Every "Send" button in {name} creates an issue here. You can change it later.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Destination">
              {([["jira", Ticket], ["linear", CircleCheckBig]] as const).map(([d, Icon]) => {
                const on = cfg.connected[d] && cfg.defaultDest === d;
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setCfg({ ...cfg, defaultDest: d, connected: { ...cfg.connected, jira: d === "jira", linear: d === "linear" }, destKey: d === "jira" ? slugify(name).replace(/-/g, "").slice(0, 4).toUpperCase() : name })}
                    className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:focus-ring", on ? "border-primary bg-primary-soft/50" : "border-input hover:border-border-hover")}
                  >
                    <span className="flex size-10 items-center justify-center rounded-[10px] bg-muted"><Icon className="size-5" aria-hidden="true" /></span>
                    <span className="flex-1">
                      <span className="block font-semibold">{INTEGRATIONS[d].name}</span>
                      <span className="block text-caption text-muted-foreground">{d === "jira" ? "Issues in a Jira project" : "Issues for a Linear team"}</span>
                    </span>
                    {on && <Check className="size-5 text-primary" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            {(cfg.connected.jira || cfg.connected.linear) && (
              <DestinationFields id={cfg.defaultDest} value={cfg.destKey} onChange={(v) => setCfg({ ...cfg, destKey: v })} />
            )}
          </div>
        )}

        {step === 3 && created && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-chart-pos text-white">
              <Check className="size-7" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <div className="flex items-center gap-3">
              <ProjectMark project={{ name, color }} size={36} />
              <span className="text-h2">{name}</span>
            </div>
            <ul className="w-full max-w-sm divide-y divide-border rounded-xl border border-border text-left">
              <li className="flex justify-between gap-3 px-4 py-3"><span className="text-muted-foreground">Sources</span><span className="font-medium">{sourcesOn.map((s) => INTEGRATIONS[s].name).join(", ") || "None yet"}</span></li>
              <li className="flex justify-between gap-3 px-4 py-3"><span className="text-muted-foreground">Destination</span><span className="font-medium">{cfg.connected[cfg.defaultDest] ? `${INTEGRATIONS[cfg.defaultDest].name}${cfg.destKey ? ` · ${cfg.destKey}` : ""}` : "Not set"}</span></li>
            </ul>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between gap-3">
        {step > 0 && step < 3 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft /> Back</Button>
        ) : <span />}
        {step === 0 && <Button size="lg" disabled={!canNext} onClick={() => setStep(1)}>Continue <ArrowRight /></Button>}
        {step === 1 && (
          <Button size="lg" onClick={() => setStep(2)}>{sourcesOn.length ? "Continue" : "Skip for now"} <ArrowRight /></Button>
        )}
        {step === 2 && <Button size="lg" onClick={finish}>Create project</Button>}
        {step === 3 && <Button size="lg" onClick={() => navigate({ to: "/dashboard" })}>Go to {name} <ArrowRight /></Button>}
      </div>
    </div>
  );
}
