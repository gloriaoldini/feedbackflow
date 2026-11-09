import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Check, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, PageHeader, Segmented, StatusTag, useTheme } from "@/components/app/primitives";
import { ProjectMark } from "@/components/app/ProjectSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/lib/data";
import { DEMO_FEATURES, demoFeedback } from "@/lib/demo-data";
import { COLOR_CLASS, PROJECT_COLORS, WORKSPACES, switchWorkspace, useCurrentProject, useProjects, useWorkspace, type Project } from "@/lib/projects";
import { store, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS = ["profile", "workspace", "projects", "notifications", "appearance", "billing"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/_authenticated/settings")({
  validateSearch: z.object({ tab: z.enum(TABS).optional() }),
  head: () => ({ meta: [{ title: "Settings · FeedBackFlow" }] }),
  component: SettingsPage,
});

const LABEL: Record<Tab, string> = { profile: "Profile", workspace: "Workspace", projects: "Projects", notifications: "Notifications", appearance: "Appearance", billing: "Billing" };

function SettingsPage() {
  const { tab = "profile" } = Route.useSearch();
  const navigate = useNavigate({ from: "/settings" });
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 animate-fade-up">
      <PageHeader title="Your" accent="settings" sub="Manage your profile, workspace, projects and billing." />
      <Segmented label="Settings sections" value={tab} onChange={(t) => navigate({ search: { tab: t } })} items={TABS.map((t) => ({ value: t, label: LABEL[t] }))} />
      <div className="flex flex-col">
        {tab === "profile" && <ProfileTab />}
        {tab === "workspace" && <WorkspaceTab />}
        {tab === "projects" && <ProjectsTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "appearance" && <AppearanceTab />}
        {tab === "billing" && <BillingTab />}
      </div>
    </div>
  );
}

function Row({ title, sub, children, danger }: { title: string; sub: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className="grid gap-3 border-t border-border py-6 first:border-t-0 first:pt-1 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <div>
        <h2 className={cn("text-h3", danger && "text-neg-fg")}>{title}</h2>
        <p className="mt-1 text-caption leading-[18px] text-muted-foreground">{sub}</p>
      </div>
      {children}
    </section>
  );
}

function ProfileTab() {
  const saved = useApp((s) => s.profileName);
  const email = useApp((s) => s.email);
  const [name, setName] = useState(saved);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const navigate = useNavigate();
  useEffect(() => setName(saved), [saved]);
  const dirty = name.trim() !== saved;

  const save = async () => {
    store.set({ profileName: name.trim() || saved });
    if (!isDemoMode()) await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setJustSaved(true);
    toast.success("Profile saved");
  };
  const signOut = async () => {
    if (!isDemoMode()) await supabase.auth.signOut();
    store.set({ demo: false });
    navigate({ to: "/" });
  };

  return (
    <>
      <Row title="Profile" sub="How you appear to your teammates.">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-5 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={saved} size={56} brand />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => toast("Photo upload isn't available in the demo")}>Upload photo</Button>
                <Button size="sm" variant="ghost" disabled>Remove</Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fn" className="text-[13px] font-medium">Full name</label>
                <Input id="fn" value={name} onChange={(e) => { setName(e.target.value); setJustSaved(false); }} placeholder="Jane Doe" autoComplete="name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="em" className="text-[13px] font-medium">Email</label>
                <Input id="em" value={email} disabled aria-describedby="em-help" />
                <span id="em-help" className="flex items-center gap-1.5 text-caption text-muted-foreground"><Lock className="size-3" aria-hidden="true" /> Ask a workspace admin to change your email.</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-background px-5 py-3 md:px-6">
            {justSaved && !dirty && (
              <span role="status" className="mr-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-pos-fg"><Check className="size-3.5" aria-hidden="true" /> Changes saved</span>
            )}
            <Button variant="ghost" disabled={!dirty} onClick={() => setName(saved)}>Cancel</Button>
            <Button disabled={!dirty} onClick={save}>Save changes</Button>
          </div>
        </Card>
      </Row>
      <Row title="Session" sub="You're signed in on this device.">
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5 md:px-6">
          <div><p className="font-medium">Sign out</p><p className="text-caption text-muted-foreground">You can sign back in with Google or email.</p></div>
          <Button variant="secondary" onClick={signOut}>Sign out</Button>
        </Card>
      </Row>
      <Row title="Danger zone" sub="This can't be undone." danger>
        <Card className="flex flex-wrap items-center justify-between gap-4 border-neg-bd p-5 md:px-6">
          <div><p className="font-medium">Delete account</p><p className="text-caption text-muted-foreground">Removes your profile. Workspace data stays with your team.</p></div>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>Delete account</Button>
        </Card>
      </Row>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>Your profile and personal settings will be removed. This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirmDelete(false); toast("Account deletion is disabled in the demo"); }}>Delete account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WorkspaceTab() {
  const ws = useWorkspace();
  const slug = useApp((s) => s.workspaceSlug);
  const [name, setName] = useState(ws.name);
  const [s, setS] = useState(slug);
  useEffect(() => setName(ws.name), [ws.name]);
  const names = useApp((st) => st.workspaceNames);
  return (
    <>
    <Row title="Workspace" sub="Your company. Billing and members are shared by all its projects.">
      <Card className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ws" className="text-[13px] font-medium">Workspace name</label>
          <Input id="ws" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="text-[13px] font-medium">Workspace URL</label>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:border-primary">
            <span className="flex items-center whitespace-nowrap border-r border-input bg-muted px-3 text-[14px] text-muted-foreground">feedbackflow.app/</span>
            <input id="slug" value={s} onChange={(e) => setS(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[14px] focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            disabled={name.trim() === ws.name && s === slug}
            onClick={() => { store.set((st) => ({ workspaceNames: { ...st.workspaceNames, [ws.id]: name.trim() || ws.name }, workspaceSlug: s })); toast.success("Workspace updated"); }}
          >
            Save workspace
          </Button>
        </div>
      </Card>
    </Row>
    <Row title="Switch workspace" sub="Only if you work for more than one company. Each workspace has its own projects and billing.">
      <Card className="divide-y divide-border overflow-hidden">
        {WORKSPACES.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-4 p-4 md:px-6">
            <div>
              <p className="font-medium">{names[w.id] ?? w.name}</p>
              <p className="text-caption text-muted-foreground">{w.plan} plan</p>
            </div>
            {w.id === ws.id ? (
              <StatusTag tone="brand"><Check className="size-3" aria-hidden="true" /> Current</StatusTag>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => { switchWorkspace(w.id); toast(`Switched to ${names[w.id] ?? w.name}`); }}>Switch</Button>
            )}
          </div>
        ))}
      </Card>
    </Row>
    </>
  );
}

function ProjectsTab() {
  const ws = useWorkspace();
  const projects = useProjects();
  const current = useCurrentProject();
  const [editing, setEditing] = useState<Project | null>(null);
  const [archiving, setArchiving] = useState<Project | null>(null);

  return (
    <Row title="Projects" sub={`Products in ${ws.name}. Each one has its own inbox, insights, sources and destination.`}>
      <div className="flex flex-col gap-3">
        <Card className="divide-y divide-border overflow-hidden">
          {projects.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-4 md:px-5">
              <ProjectMark project={p} size={36} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">{p.name} {p.id === current.id && <StatusTag tone="brand">Current</StatusTag>}</p>
                <p className="truncate text-caption text-muted-foreground">{p.description || "No description"}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>Edit</Button>
                <Button size="sm" variant="ghost" disabled={projects.length < 2} onClick={() => setArchiving(p)}>Archive</Button>
              </div>
            </div>
          ))}
        </Card>
        <Button asChild variant="secondary" className="self-start">
          <Link to="/projects/new"><Plus /> New project</Link>
        </Button>
      </div>
      {editing && <EditProjectDialog project={editing} onClose={() => setEditing(null)} />}
      <Dialog open={!!archiving} onOpenChange={(o) => !o && setArchiving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive {archiving?.name}?</DialogTitle>
            <DialogDescription>Its feedback stops syncing and it disappears from the switcher. You can restore it from support.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setArchiving(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                const p = archiving!;
                store.set((s) => ({ archivedProjects: [...s.archivedProjects, p.id], projectId: s.projectId === p.id ? projects.find((x) => x.id !== p.id)!.id : s.projectId }));
                toast(`${p.name} archived`);
                setArchiving(null);
              }}
            >
              Archive project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Row>
  );
}

function EditProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [color, setColor] = useState(project.color);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>Changes are visible to everyone in the workspace.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ep-name" className="text-[13px] font-medium">Name</label>
            <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ep-desc" className="text-[13px] font-medium">Description</label>
            <Input id="ep-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={80} />
          </div>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium">Color</legend>
            <div className="flex flex-wrap gap-2.5">
              {PROJECT_COLORS.map((c) => (
                <button key={c} type="button" aria-label={c} aria-pressed={color === c} onClick={() => setColor(c)}
                  className={cn("flex size-9 items-center justify-center rounded-lg text-white ring-offset-2 ring-offset-card focus-visible:outline-none focus-visible:focus-ring", COLOR_CLASS[c], color === c && "ring-2 ring-foreground")}>
                  {color === c && <Check className="size-4" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={() => {
            store.set((s) => ({ projectOverrides: { ...s.projectOverrides, [project.id]: { name: name.trim(), description: description.trim(), color } } }));
            toast.success("Project updated");
            onClose();
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const NOTIFS = [
  ["digest", "Weekly digest", "A summary of top insights for each project every Monday."],
  ["urgent", "Urgent alerts", "Email me when a spike of urgent issues is detected."],
  ["trending", "New feature requests", "Tell me when a new theme starts trending."],
] as const;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function NotificationsTab() {
  const n = useApp((s) => s.notifications);
  const email = useApp((s) => s.email);
  const day = useApp((s) => s.digestDay);
  const [preview, setPreview] = useState(false);
  return (
    <>
    <Row title="Email notifications" sub={`Sent to ${email}.`}>
      <Card className="divide-y divide-border overflow-hidden">
        {NOTIFS.map(([k, title, desc]) => (
          <div key={k} className="flex items-center justify-between gap-4 p-4 md:px-6">
            <div>
              <p id={`n-${k}`} className="font-medium">{title}</p>
              <p className="text-caption text-muted-foreground">{desc}</p>
            </div>
            <Switch aria-labelledby={`n-${k}`} checked={!!n[k]} onCheckedChange={(v) => store.set((s) => ({ notifications: { ...s.notifications, [k]: v } }))} />
          </div>
        ))}
      </Card>
    </Row>
    {n.digest && (
      <Row title="Weekly digest" sub="One email per workspace with every project's numbers, top request and what needs attention.">
        <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="digest-day" className="text-[13px] font-medium">Send it every</label>
            <select id="digest-day" value={day} onChange={(e) => store.set({ digestDay: e.target.value })}
              className="h-9 w-48 rounded-lg border border-input bg-card px-3 text-[14px] hover:border-border-hover focus:border-primary focus:outline-none">
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <span className="text-caption text-muted-foreground">at 9:00, your time</span>
          </div>
          <Button variant="secondary" onClick={() => setPreview(true)}>Preview digest</Button>
        </Card>
      </Row>
    )}
    <DigestPreview open={preview} onOpenChange={setPreview} day={day} />
    </>
  );
}

function DigestPreview({ open, onOpenChange, day }: { open: boolean; onOpenChange: (v: boolean) => void; day: string }) {
  const ws = useWorkspace();
  const projects = useProjects();
  const email = useApp((s) => s.email);
  const name = useApp((s) => s.profileName);
  const rows = projects.map((p) => {
    const fb = demoFeedback().filter((f) => f.project_id === p.id);
    const top = DEMO_FEATURES.filter((f) => f.project_id === p.id)[0];
    const pos = fb.length ? Math.round((fb.filter((f) => f.sentiment === "positive").length / fb.length) * 100) : 0;
    return { p, n: fb.length, pos, urgent: fb.filter((f) => f.urgency === "high").length, top };
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Weekly digest preview</DialogTitle>
          <DialogDescription>Arrives every {day} at 9:00 in {email}.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 md:p-5">
          <p className="text-overline text-muted-foreground">FeedBackFlow · {ws.name}</p>
          <p className="text-h2">Your week in <em className="serif-accent">feedback</em></p>
          <p className="text-muted-foreground">Hi {name.split(" ")[0]}, here's what customers said across {rows.length} {rows.length === 1 ? "project" : "projects"}.</p>
          <ul className="flex flex-col gap-2">
            {rows.map(({ p, n, pos, urgent, top }) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5">
                <span className="flex items-center gap-2"><ProjectMark project={p} size={20} /><b className="font-semibold">{p.name}</b></span>
                <span className="tabular text-[13px] text-muted-foreground">{n} messages · {pos}% positive · {urgent} urgent</span>
                {top ? <span className="text-[13px]">Top request: <b className="font-semibold">{top.topic_name}</b> ({top.mention_count} mentions)</span> : <span className="text-[13px] text-muted-foreground">No requests yet</span>}
              </li>
            ))}
          </ul>
          <span className="self-start rounded-lg bg-primary bg-button px-3 py-2 text-[13px] font-medium text-white">Open dashboard</span>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => { onOpenChange(false); toast.success(`Test digest sent to ${email}`); }}>Send me a test</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const opts = [
    { v: "light", label: "Light", preview: <span className="flex h-[72px] gap-1.5 rounded-lg border border-[#ECE4DA] bg-[#FBF8F4] p-2"><span className="w-[18px] rounded bg-[#F3EDE6]" /><span className="flex flex-1 flex-col gap-1.5"><span className="h-2 w-3/5 rounded-sm bg-[#22181A]" /><span className="flex-1 rounded border border-[#ECE4DA] bg-white" /></span></span> },
    { v: "dark", label: "Dark", preview: <span className="flex h-[72px] gap-1.5 rounded-lg border border-[#342B26] bg-[#15110F] p-2"><span className="w-[18px] rounded bg-[#2B2320]" /><span className="flex flex-1 flex-col gap-1.5"><span className="h-2 w-3/5 rounded-sm bg-[#F4EDE7]" /><span className="flex-1 rounded border border-[#342B26] bg-[#211B18]" /></span></span> },
    { v: "system", label: "System", preview: <span className="flex h-[72px] overflow-hidden rounded-lg border border-border"><span className="flex-1 bg-[#FBF8F4]" /><span className="flex-1 bg-[#15110F]" /></span> },
  ] as const;
  return (
    <Row title="Theme" sub="Choose how FeedBackFlow looks on this device. The dark mode switch changes it too.">
      <Card className="p-5 md:p-6">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2 sm:gap-3">
          {opts.map((o) => (
            <button key={o.v} role="radio" aria-checked={theme === o.v} onClick={() => setTheme(o.v)}
              className={cn("flex flex-col gap-2.5 rounded-xl border-[1.5px] bg-card p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:focus-ring", theme === o.v ? "border-primary shadow-[0_0_0_3px_oklch(0.586_0.192_20/0.12)]" : "border-input hover:border-border-hover")}>
              {o.preview}
              <span className="text-[13px] font-medium">{o.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </Row>
  );
}

function BillingTab() {
  const ws = useWorkspace();
  const projects = useProjects();
  return (
    <>
      <Row title="Plan" sub="Billed monthly per workspace. Cancel anytime.">
        <Card className="flex flex-wrap items-start justify-between gap-4 p-5 md:p-6">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2"><span className="text-[20px] font-semibold tracking-[-0.015em]">{ws.plan}</span><StatusTag tone="brand">Current plan</StatusTag></span>
            <span className="text-muted-foreground"><b className="tabular font-semibold text-foreground">{ws.plan === "Pro" ? "$99" : "$49"}</b> / month · {ws.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => toast("The billing portal opens in Stripe (disabled in the demo)")}>Manage billing</Button>
            <Button onClick={() => toast("Upgrades are disabled in the demo")}>Upgrade to Business</Button>
          </div>
        </Card>
      </Row>
      <Row title="Usage this month" sub="Resets on the 1st.">
        <Card className="flex flex-col gap-4 p-5 md:p-6">
          {[["Feedback ingested", 2184, 5000], ["AI analyses", 892, 2500], ["Projects", projects.length, ws.plan === "Pro" ? 5 : 2]].map(([l, v, max]) => (
            <div key={l as string} className="flex flex-col gap-2">
              <div className="flex justify-between"><span className="font-medium">{l}</span><span className="tabular text-muted-foreground">{(v as number).toLocaleString()} / {(max as number).toLocaleString()}</span></div>
              <span className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((v as number) / (max as number)) * 100)}%` }} /></span>
            </div>
          ))}
        </Card>
      </Row>
    </>
  );
}
