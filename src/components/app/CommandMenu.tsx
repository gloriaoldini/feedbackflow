import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FolderPlus, Inbox, LayoutDashboard, Moon, Plug, Search, Settings, Sparkles, Sun } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useFeatures, useFeedback } from "@/lib/data";
import { switchProject, useCurrentProject, useProjects } from "@/lib/projects";
import { resolveTheme, store, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ProjectMark } from "./ProjectSwitcher";
import { SourceIcon } from "./primitives";

const OPEN_EVENT = "fbf:command-menu";
export const openCommandMenu = () => window.dispatchEvent(new Event(OPEN_EVENT));

const PAGES = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

/** ⌘K / Ctrl+K: jump to any message, request, page or project. */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: items = [] } = useFeedback();
  const { data: features = [] } = useFeatures();
  const projects = useProjects();
  const current = useCurrentProject();
  const dark = useApp((s) => resolveTheme(s.theme) === "dark");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[12vh] max-w-xl translate-y-0 overflow-hidden p-0 [&>button]:hidden" aria-describedby={undefined}>
      <DialogTitle className="sr-only">Search</DialogTitle>
      <Command
        filter={(value, search) => (value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0)}
        className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-overline [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:gap-2.5 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:size-4"
      >
      <CommandInput placeholder={`Search ${current.name}: messages, requests, pages…`} />
      <CommandList className="max-h-[min(420px,60vh)]">
        <CommandEmpty>No results. Try a customer name or a topic.</CommandEmpty>
        <CommandGroup heading="Feedback">
          {items.slice(0, 40).map((it) => (
            <CommandItem key={it.id} value={`${it.author} ${it.original_text} ${it.summary}`} onSelect={() => go(() => navigate({ to: "/inbox", search: { id: it.id } }))}>
              <SourceIcon source={it.source} className="text-muted-foreground" />
              <span className="shrink-0 font-medium">{it.author}</span>
              <span className="truncate text-muted-foreground">{it.summary}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Top requests">
          {features.map((f) => (
            <CommandItem key={f.id} value={`request ${f.topic_name}`} onSelect={() => go(() => navigate({ to: "/insights" }))}>
              <Sparkles className="text-primary-ink" />
              <span className="flex-1">{f.topic_name}</span>
              <span className="tabular text-caption text-muted-foreground">{f.mention_count} mentions</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {PAGES.map((p) => (
            <CommandItem key={p.to} value={`page ${p.label}`} onSelect={() => go(() => navigate({ to: p.to }))}>
              <p.icon /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Switch product">
          {projects.map((p) => (
            <CommandItem key={p.id} value={`product ${p.name}`} onSelect={() => go(() => switchProject(p.id))}>
              <ProjectMark project={p} size={20} />
              <span className="flex-1">{p.name}</span>
              {p.id === current.id && <span className="text-caption text-muted-foreground">Current</span>}
            </CommandItem>
          ))}
          <CommandItem value="new product create" onSelect={() => go(() => navigate({ to: "/projects/new" }))}>
            <FolderPlus /> New product
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem value="toggle dark mode theme" onSelect={() => go(() => store.set({ theme: dark ? "light" : "dark" }))}>
            {dark ? <Sun /> : <Moon />} Switch to {dark ? "light" : "dark"} mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
      </Command>
      </DialogContent>
    </Dialog>
  );
}

/** Opens the command menu. Full field in the sidebar, icon on the rail and mobile bar. */
export function SearchTrigger({ variant }: { variant: "sidebar" | "icon" }) {
  const [mac, setMac] = useState(true);
  useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  if (variant === "icon")
    return (
      <button
        onClick={openCommandMenu}
        aria-label="Search"
        title="Search"
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:focus-ring"
      >
        <Search className="size-[18px]" aria-hidden="true" />
      </button>
    );
  return (
    <button
      onClick={openCommandMenu}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-2.5 text-[13.5px] text-ink-subtle shadow-card",
        "hover:border-border-hover focus-visible:outline-none focus-visible:focus-ring",
      )}
    >
      <Search className="size-4" aria-hidden="true" />
      <span className="flex-1 text-left">Search…</span>
      <CommandShortcut className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] tracking-normal">{mac ? "⌘K" : "Ctrl K"}</CommandShortcut>
    </button>
  );
}
