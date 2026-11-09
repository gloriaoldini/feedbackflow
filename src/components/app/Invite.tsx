import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useProjects, useWorkspace } from "@/lib/projects";
import { store, useApp, type Member } from "@/lib/store";
import { NativeSelect } from "./NativeSelect";
import { ProjectMark } from "./ProjectSwitcher";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function inviteLink(teamId: string, email: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}join?team=${teamId}&email=${encodeURIComponent(email)}`;
}

export function setTeamMembers(teamId: string, fn: (m: Member[]) => Member[]) {
  store.set((st) => ({ members: { ...st.members, [teamId]: fn(st.members[teamId] ?? []) } }));
}

/** Invite one or more people by email, with a role and an optional note. */
export function InviteDialog({ open, onOpenChange, onPreview }: { open: boolean; onOpenChange: (v: boolean) => void; onPreview: (m: Member) => void }) {
  const team = useWorkspace();
  const products = useProjects();
  const members = useApp((s) => s.members[team.id] ?? []);
  const [draft, setDraft] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<Member["role"]>("Member");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const addTokens = (text: string) => {
    const parts = text.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
    const bad = parts.filter((p) => !EMAIL.test(p));
    const existing = parts.filter((p) => members.some((m) => m.email === p));
    const ok = parts.filter((p) => EMAIL.test(p) && !members.some((m) => m.email === p));
    setEmails((list) => [...new Set([...list, ...ok])]);
    setError(bad.length ? `"${bad[0]}" isn't a valid email.` : existing.length ? `${existing[0]} is already in ${team.name}.` : "");
    setDraft(bad.join(" "));
  };

  const reset = () => { setDraft(""); setEmails([]); setRole("Member"); setMessage(""); setError(""); };
  const all = [...emails, ...(EMAIL.test(draft.trim()) && !members.some((m) => m.email === draft.trim().toLowerCase()) ? [draft.trim().toLowerCase()] : [])];

  const send = () => {
    if (!all.length) return;
    const now = new Date().toISOString();
    const added: Member[] = all.map((email, i) => ({ id: `m-${Date.now()}-${i}`, name: email.split("@")[0], email, role, pending: true, invitedAt: now, message: message.trim() || undefined }));
    setTeamMembers(team.id, (m) => [...m, ...added]);
    toast.success(all.length === 1 ? `Invite sent to ${all[0]}` : `${all.length} invites sent`, {
      description: "They'll get an email with a link to join.",
      action: { label: "Preview email", onClick: () => onPreview(added[0]) },
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite people to {team.name}</DialogTitle>
          <DialogDescription>They'll see all {products.length} {products.length === 1 ? "product" : "products"} in this team.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-emails" className="text-[13px] font-medium">Email addresses</label>
          <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 focus-within:border-primary focus-within:shadow-[0_0_0_3px_oklch(0.586_0.192_20/0.15)]">
            {emails.map((e) => (
              <span key={e} className="inline-flex h-7 items-center gap-1 rounded-full bg-muted pl-2.5 pr-1 text-[13px]">
                {e}
                <button type="button" aria-label={`Remove ${e}`} onClick={() => setEmails((l) => l.filter((x) => x !== e))} className="rounded-full p-0.5 text-muted-foreground hover:bg-border hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <input
              id="invite-emails"
              value={draft}
              autoFocus
              onChange={(e) => { const v = e.target.value; if (/[,;\s]$/.test(v)) addTokens(v); else { setDraft(v); setError(""); } }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); draft.trim() ? addTokens(draft) : send(); }
                if (e.key === "Backspace" && !draft && emails.length) setEmails((l) => l.slice(0, -1));
              }}
              onBlur={() => draft.trim() && addTokens(draft)}
              onPaste={(e) => { e.preventDefault(); addTokens(draft + " " + e.clipboardData.getData("text")); }}
              placeholder={emails.length ? "" : "sam@company.com, priya@company.com"}
              aria-describedby="invite-help"
              aria-invalid={!!error}
              className="h-7 min-w-[160px] flex-1 bg-transparent px-1 text-[14px] placeholder:text-ink-subtle focus:outline-none"
            />
          </div>
          <p id="invite-help" className={error ? "text-caption text-neg-fg" : "text-caption text-muted-foreground"}>
            {error || "Separate several emails with a comma, or paste a list."}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-role" className="text-[13px] font-medium">Role</label>
          <NativeSelect id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Member["role"])} className="w-full">
            <option value="Member">Member: reads feedback, sends requests to Jira or Linear</option>
            <option value="Admin">Admin: also adds products, integrations, members and billing</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-msg" className="text-[13px] font-medium">Personal note <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Textarea id="invite-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Join us here, so we can review customer feedback together." className="min-h-20 text-[14px]" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={send} disabled={!all.length}>
            <Send /> {all.length > 1 ? `Send ${all.length} invites` : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** What the invited person receives. The button opens the join page, so the flow can be tried in the demo. */
export function InviteEmailPreview({ member, onOpenChange }: { member: Member | null; onOpenChange: (v: boolean) => void }) {
  const team = useWorkspace();
  const products = useProjects();
  const inviter = useApp((s) => s.profileName);
  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite email preview</DialogTitle>
          <DialogDescription>Sent to {member?.email}. Click the button to see the page they land on.</DialogDescription>
        </DialogHeader>
        {member && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5">
            <p className="flex items-center gap-2 text-caption text-muted-foreground"><Mail className="size-3.5" aria-hidden="true" /> From: {inviter} via FeedBackFlow</p>
            <p className="text-h2">{inviter} invited you to <em className="serif-accent">{team.name}</em></p>
            {member.message && <blockquote className="rounded-lg border-l-2 border-primary bg-card px-3 py-2 text-[14px] text-ink-2">“{member.message}”</blockquote>}
            <p className="text-muted-foreground">You'll join as {member.role === "Admin" ? "an admin" : "a member"} and see customer feedback for:</p>
            <ul className="flex flex-wrap gap-2">
              {products.map((p) => (
                <li key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-[13px] font-medium">
                  <ProjectMark project={p} size={20} /> {p.name}
                </li>
              ))}
            </ul>
            <Button asChild className="self-start">
              <Link to="/join" search={{ team: team.id, email: member.email }} onClick={() => onOpenChange(false)}>Join {team.name}</Link>
            </Button>
            <p className="text-caption text-muted-foreground">The link expires in 7 days.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
