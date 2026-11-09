import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus, Search, Settings2, Users } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_CLASS, switchProject, useCurrentProject, useTeams, useWorkspace, type Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

export function ProjectMark({ project, size = 28, className }: { project: Pick<Project, "name" | "color">; size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white", COLOR_CLASS[project.color] ?? COLOR_CLASS.coral, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {project.name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

const TEAM_LABEL = "block truncate text-[10.5px] font-semibold uppercase leading-3 tracking-[0.06em] text-muted-foreground";

/**
 * Product switcher. Shows the hierarchy: each team, with its products underneath.
 * Picking a product in another team switches team too.
 */
export function ProjectSwitcher({ variant }: { variant: "sidebar" | "rail" | "topbar" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const project = useCurrentProject();
  const team = useWorkspace();
  const teams = useTeams();
  const query = q.trim().toLowerCase();
  const label = `Product: ${project.name}, team ${team.name}. Switch product or team`;

  const pick = (p: Project, teamName: string) => {
    switchProject(p.id);
    setOpen(false);
    toast(p.workspaceId === team.id ? `Switched to ${p.name}` : `Switched to ${p.name} · ${teamName}`);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild>
        {variant === "rail" ? (
          <button aria-label={label} title={`${team.name} · ${project.name}`} className="rounded-lg focus-visible:outline-none focus-visible:focus-ring">
            <ProjectMark project={project} size={36} />
          </button>
        ) : variant === "topbar" ? (
          <button className="flex min-w-0 items-center gap-2 rounded-lg py-1 pr-1.5 text-left focus-visible:outline-none focus-visible:focus-ring" aria-label={label}>
            <ProjectMark project={project} size={30} />
            <span className="min-w-0">
              <span className={TEAM_LABEL}>{team.name}</span>
              <span className="block truncate text-[15px] font-semibold leading-5">{project.name}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
          </button>
        ) : (
          <button
            aria-label={label}
            className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-card p-2 text-left shadow-card transition-colors hover:border-border-hover focus-visible:outline-none focus-visible:focus-ring data-[state=open]:border-border-hover"
          >
            <ProjectMark project={project} size={32} />
            <span className="min-w-0 flex-1">
              <span className={TEAM_LABEL}>{team.name}</span>
              <span className="mt-0.5 block truncate text-[14px] font-semibold leading-5">{project.name}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side={variant === "rail" ? "right" : "bottom"}
        sideOffset={8}
        className="w-[min(320px,calc(100vw-24px))] rounded-xl border-border p-0 shadow-pop"
      >
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <label htmlFor="project-search" className="sr-only">Find a product</label>
            <input
              id="project-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a product…"
              className="h-9 w-full rounded-lg bg-muted pl-8 pr-3 text-[14px] placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="max-h-[min(440px,60vh)] overflow-y-auto p-1.5">
          {teams.map((t, ti) => {
            const products = t.products.filter((p) => p.name.toLowerCase().includes(query));
            if (query && !products.length) return null;
            const current = t.id === team.id;
            return (
              <section key={t.id} aria-label={`Team ${t.name}`} className={cn("pb-1.5", ti > 0 && "mt-1 border-t border-border pt-1.5")}>
                <div className="flex items-center gap-2 px-2 pb-1 pt-1.5">
                  <Users className="size-3.5 text-ink-subtle" aria-hidden="true" />
                  <span className="flex-1 truncate text-overline text-muted-foreground">{t.name}</span>
                  <span className="text-caption text-muted-foreground">{t.members.length} {t.members.length === 1 ? "member" : "members"}</span>
                </div>
                <ul className="ml-[15px] flex flex-col border-l border-border pl-1.5">
                  {products.map((p) => (
                    <li key={p.id}>
                      <button onClick={() => pick(p, t.name)} className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
                        <ProjectMark project={p} size={26} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">{p.name}</span>
                          {p.description && <span className="block truncate text-caption text-muted-foreground">{p.description}</span>}
                        </span>
                        {p.id === project.id && <Check className="size-4 text-primary" aria-label="Current product" />}
                      </button>
                    </li>
                  ))}
                  {current && !query && (
                    <li>
                      <button
                        onClick={() => { setOpen(false); navigate({ to: "/projects/new" }); }}
                        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-[13.5px] font-medium text-primary-ink hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      >
                        <span className="flex size-[26px] items-center justify-center rounded-lg border border-dashed border-border-hover">
                          <Plus className="size-3.5" aria-hidden="true" />
                        </span>
                        New product
                      </button>
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
          {query && teams.every((t) => !t.products.some((p) => p.name.toLowerCase().includes(query))) && (
            <p className="px-2 py-3 text-caption text-muted-foreground">No product matches “{q}”.</p>
          )}
        </div>
        <div className="flex flex-col border-t border-border p-1.5">
          <Link to="/settings" search={{ tab: "workspace" }} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] text-ink-3 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
            <Users className="size-4 text-ink-subtle" aria-hidden="true" /> Team & members
          </Link>
          <Link to="/settings" search={{ tab: "projects" }} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] text-ink-3 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
            <Settings2 className="size-4 text-ink-subtle" aria-hidden="true" /> Manage products
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
