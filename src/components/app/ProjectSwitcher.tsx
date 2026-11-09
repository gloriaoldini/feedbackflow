import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Plus, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COLOR_CLASS, switchProject, useCurrentProject, useProjects, type Project } from "@/lib/projects";
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

/** Switch product (project). One product at a time, everywhere. Workspaces live in Settings. */
export function ProjectSwitcher({ variant }: { variant: "sidebar" | "rail" | "topbar" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const project = useCurrentProject();
  const projects = useProjects();
  const shown = projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const pick = (p: Project) => {
    switchProject(p.id);
    setOpen(false);
    toast(`Switched to ${p.name}`);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }}>
      <PopoverTrigger asChild>
        {variant === "rail" ? (
          <button
            aria-label={`Product: ${project.name}. Switch product`}
            title={`${project.name} · switch product`}
            className="rounded-lg focus-visible:outline-none focus-visible:focus-ring"
          >
            <ProjectMark project={project} size={36} />
          </button>
        ) : variant === "topbar" ? (
          <button className="flex min-w-0 items-center gap-2 rounded-lg py-1 pr-1.5 focus-visible:outline-none focus-visible:focus-ring" aria-label={`Product: ${project.name}. Switch product`}>
            <ProjectMark project={project} size={28} />
            <span className="truncate text-[15px] font-semibold">{project.name}</span>
            <ChevronsUpDown className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
          </button>
        ) : (
          <button className="flex w-full items-center gap-2.5 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-card focus-visible:outline-none focus-visible:focus-ring data-[state=open]:border-border data-[state=open]:bg-card">
            <ProjectMark project={project} size={32} />
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-5">{project.name}</span>
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
        <div className="max-h-72 overflow-y-auto p-1.5">
          <p className="px-2 pb-1 pt-1.5 text-overline text-muted-foreground">Your products</p>
          {shown.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p)}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <ProjectMark project={p} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{p.name}</span>
                {p.description && <span className="block truncate text-caption text-muted-foreground">{p.description}</span>}
              </span>
              {p.id === project.id && <Check className="size-4 text-primary" aria-label="Current product" />}
            </button>
          ))}
          {shown.length === 0 && <p className="px-2 py-3 text-caption text-muted-foreground">No product matches “{q}”.</p>}
          <button
            onClick={() => { setOpen(false); navigate({ to: "/projects/new" }); }}
            className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-[14px] font-medium text-primary-ink hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            <span className="flex size-7 items-center justify-center rounded-lg border border-dashed border-border-hover">
              <Plus className="size-4" aria-hidden="true" />
            </span>
            New product
          </button>
        </div>
        <div className="border-t border-border p-1.5">
          <Link
            to="/settings"
            search={{ tab: "projects" }}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] text-ink-3 hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            <Settings2 className="size-4 text-ink-subtle" aria-hidden="true" /> Manage products
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
