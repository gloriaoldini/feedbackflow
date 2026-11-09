import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientOnly } from "@/components/ClientOnly";
import { Logo, ThemeToggle } from "@/components/app/primitives";
import { ProjectMark } from "@/components/app/ProjectSwitcher";
import { setTeamMembers } from "@/components/app/Invite";
import { switchWorkspace, useTeams } from "@/lib/projects";
import { store, useApp } from "@/lib/store";

/** /join?team=acme&email=… — the page an invited person lands on from the invite email. */
export const Route = createFileRoute("/join")({
  validateSearch: z.object({ team: z.string().optional(), email: z.string().optional() }),
  head: () => ({ meta: [{ title: "Join your team · FeedBackFlow" }] }),
  component: () => (
    <div className="flex min-h-screen flex-col bg-panel">
      <header className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link to="/" aria-label="FeedBackFlow home"><Logo /></Link>
        <ClientOnly fallback={<span className="block h-7 w-12" />}><ThemeToggle variant="header" /></ClientOnly>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 md:items-center md:pt-0">
        <ClientOnly fallback={<div className="h-96 w-full max-w-[480px] rounded-2xl bg-card/60" />}>
          <JoinCard />
        </ClientOnly>
      </main>
    </div>
  ),
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function JoinCard() {
  const { team: teamId, email: invited } = Route.useSearch();
  const navigate = useNavigate();
  const teams = useTeams();
  const team = teams.find((t) => t.id === teamId);
  const invite = team?.members.find((m) => m.email === invited?.toLowerCase());
  const inviter = useApp((s) => s.profileName);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invited ?? "");
  const [tried, setTried] = useState(false);

  if (!team) {
    return (
      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-8 text-center shadow-pop">
        <h1 className="text-h1-sm">This invite link isn't <em className="serif-accent">valid</em></h1>
        <p className="mt-2 text-muted-foreground">It may have expired or been cancelled. Ask a team admin to send you a new one.</p>
        <Button asChild className="mt-6"><Link to="/">Go to FeedBackFlow</Link></Button>
      </div>
    );
  }

  const alreadyIn = invite && !invite.pending;
  const validEmail = EMAIL.test(email.trim());
  const accept = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!name.trim() || !validEmail) return;
    const mail = email.trim().toLowerCase();
    setTeamMembers(team.id, (list) =>
      list.some((m) => m.email === mail)
        ? list.map((m) => (m.email === mail ? { ...m, name: name.trim(), pending: false } : m))
        : [...list, { id: `m-${Date.now()}`, name: name.trim(), email: mail, role: "Member" }],
    );
    store.set({ demo: true, onboarded: true, tourDone: false });
    switchWorkspace(team.id);
    toast.success(`Welcome to ${team.name}`, { description: "Here's a quick tour of where things are." });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-pop md:p-8">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink"><Users className="size-5" aria-hidden="true" /></span>
      <h1 className="mt-5 text-h1-sm">
        {invite ? <>{inviter} invited you to <em className="serif-accent">{team.name}</em></> : <>Join <em className="serif-accent">{team.name}</em></>}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {invite ? `You'll join as ${invite.role === "Admin" ? "an admin" : "a member"} and see customer feedback for these products:` : "You'll see customer feedback for these products:"}
      </p>
      {invite?.message && <blockquote className="mt-4 rounded-lg border-l-2 border-primary bg-background px-3 py-2 text-[14px] text-ink-2">“{invite.message}”</blockquote>}
      <ul className="mt-4 flex flex-col gap-1 rounded-xl border border-border p-1.5">
        {team.products.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <ProjectMark project={p} size={26} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">{p.name}</span>
              {p.description && <span className="block truncate text-caption text-muted-foreground">{p.description}</span>}
            </span>
          </li>
        ))}
      </ul>

      {alreadyIn ? (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-[14px]">{invite.email} is already in this team.</p>
          <Button asChild><Link to="/dashboard" onClick={() => switchWorkspace(team.id)}>Open {team.name} <ArrowRight /></Link></Button>
        </div>
      ) : (
        <form onSubmit={accept} noValidate className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="join-name" className="text-[13px] font-medium">Your name</label>
            <Input id="join-name" autoFocus autoComplete="name" placeholder="Sam Lee" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={tried && !name.trim()} aria-describedby={tried && !name.trim() ? "join-name-err" : undefined} />
            {tried && !name.trim() && <span id="join-name-err" className="text-caption text-neg-fg">Enter your name so your team knows who you are.</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="join-email" className="text-[13px] font-medium">Work email</label>
            <Input id="join-email" type="email" autoComplete="email" value={email} readOnly={!!invite} onChange={(e) => setEmail(e.target.value)} className={invite ? "bg-muted text-muted-foreground" : undefined} aria-invalid={tried && !validEmail} />
            {invite && <span className="text-caption text-muted-foreground">The invite was sent to this address.</span>}
          </div>
          <Button type="submit" size="lg" className="w-full">Accept and join {team.name}</Button>
          <p className="text-center text-caption text-muted-foreground">
            Not for you?{" "}
            <button
              type="button"
              className="font-medium text-primary-ink hover:underline"
              onClick={() => {
                if (invite) setTeamMembers(team.id, (l) => l.filter((m) => m.id !== invite.id));
                toast("Invite declined");
                navigate({ to: "/" });
              }}
            >
              Decline the invite
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
