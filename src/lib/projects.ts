import { store, useApp, type IntegrationId } from "./store";

/**
 * Workspace = company / billing. Project = one product with its own
 * inbox, insights, sources and Jira / Linear destination.
 */
export interface Workspace {
  id: string;
  name: string;
  plan: string;
}

export interface ProjectRouting {
  slackChannels: string[];
  intercomTag: string;
  gmailAlias: string;
}

export interface ProjectConfig {
  connected: Record<IntegrationId, boolean>;
  defaultDest: "jira" | "linear";
  destKey: string; // Jira project key or Linear team
  routing: ProjectRouting;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  color: string; // one of PROJECT_COLORS
  description?: string;
}

export const PROJECT_COLORS = ["coral", "amber", "teal", "blue", "violet", "pink"] as const;
export const COLOR_CLASS: Record<string, string> = {
  coral: "bg-[oklch(0.62_0.18_25)]",
  amber: "bg-[oklch(0.72_0.15_70)]",
  teal: "bg-[oklch(0.6_0.1_180)]",
  blue: "bg-[oklch(0.57_0.14_256)]",
  violet: "bg-[oklch(0.55_0.16_295)]",
  pink: "bg-[oklch(0.64_0.18_350)]",
};

export const WORKSPACES: Workspace[] = [
  { id: "acme", name: "Acme Inc", plan: "Pro" },
  { id: "northwind", name: "Northwind Labs", plan: "Starter" },
];

export const DEMO_PROJECTS: Project[] = [
  { id: "web", workspaceId: "acme", name: "Web App", color: "coral", description: "The main SaaS dashboard" },
  { id: "mobile", workspaceId: "acme", name: "Mobile App", color: "violet", description: "iOS and Android apps" },
  { id: "api", workspaceId: "acme", name: "Public API", color: "blue", description: "REST API and webhooks" },
  { id: "insights-hub", workspaceId: "northwind", name: "Insights Hub", color: "teal", description: "Analytics product" },
];

const ALL_OFF: Record<IntegrationId, boolean> = { slack: false, intercom: false, gmail: false, jira: false, linear: false, github: false, figma: false };

export const DEMO_CONFIG: Record<string, ProjectConfig> = {
  web: {
    connected: { ...ALL_OFF, slack: true, intercom: true, jira: true },
    defaultDest: "jira",
    destKey: "WEB",
    routing: { slackChannels: ["#web-feedback", "#customer-success"], intercomTag: "web", gmailAlias: "web" },
  },
  mobile: {
    connected: { ...ALL_OFF, slack: true, gmail: true, linear: true },
    defaultDest: "linear",
    destKey: "Mobile",
    routing: { slackChannels: ["#mobile-feedback"], intercomTag: "mobile", gmailAlias: "mobile" },
  },
  api: {
    connected: { ...ALL_OFF, intercom: true, gmail: true, jira: true, github: true },
    defaultDest: "jira",
    destKey: "API",
    routing: { slackChannels: [], intercomTag: "api", gmailAlias: "api" },
  },
  "insights-hub": {
    connected: { ...ALL_OFF, slack: true, jira: true },
    defaultDest: "jira",
    destKey: "HUB",
    routing: { slackChannels: ["#hub-feedback"], intercomTag: "hub", gmailAlias: "hub" },
  },
};

export function emptyConfig(): ProjectConfig {
  return { connected: { ...ALL_OFF }, defaultDest: "jira", destKey: "", routing: { slackChannels: [], intercomTag: "", gmailAlias: "" } };
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
}

export function allProjects(): Project[] {
  const s = store.get();
  const archived = new Set(s.archivedProjects);
  return [...DEMO_PROJECTS, ...s.customProjects].filter((p) => !archived.has(p.id));
}

export function projectConfig(id: string): ProjectConfig {
  return store.get().projectConfig[id] ?? DEMO_CONFIG[id] ?? emptyConfig();
}

export function setProjectConfig(id: string, patch: Partial<ProjectConfig>) {
  store.set((s) => ({ projectConfig: { ...s.projectConfig, [id]: { ...projectConfig(id), ...patch } } }));
}

export function switchProject(id: string) {
  const p = allProjects().find((x) => x.id === id);
  if (p) store.set({ projectId: p.id, workspaceId: p.workspaceId });
}

export function switchWorkspace(id: string) {
  const first = allProjects().find((p) => p.workspaceId === id);
  store.set({ workspaceId: id, projectId: first?.id ?? "" });
}

export function createProject(p: Omit<Project, "id">, config: ProjectConfig) {
  const taken = new Set(allProjects().map((x) => x.id));
  let id = slugify(p.name);
  while (taken.has(id)) id = `${id}-2`;
  const project = { ...p, id };
  store.set((s) => ({
    customProjects: [...s.customProjects, project],
    projectConfig: { ...s.projectConfig, [id]: config },
    projectId: id,
    workspaceId: p.workspaceId,
  }));
  return project;
}

/* ---------- hooks ---------- */
export function useWorkspace() {
  const id = useApp((s) => s.workspaceId);
  const names = useApp((s) => s.workspaceNames);
  const ws = WORKSPACES.find((w) => w.id === id) ?? WORKSPACES[0];
  return { ...ws, name: names[ws.id] ?? ws.name };
}

export function useProjects(workspaceId?: string) {
  const custom = useApp((s) => s.customProjects);
  const archived = useApp((s) => s.archivedProjects);
  const renamed = useApp((s) => s.projectOverrides);
  const current = useApp((s) => s.workspaceId);
  const ws = workspaceId ?? current;
  return [...DEMO_PROJECTS, ...custom]
    .filter((p) => p.workspaceId === ws && !archived.includes(p.id))
    .map((p) => ({ ...p, ...renamed[p.id] }));
}

export function useCurrentProject(): Project {
  const projects = useProjects();
  const id = useApp((s) => s.projectId);
  return projects.find((p) => p.id === id) ?? projects[0] ?? DEMO_PROJECTS[0];
}

export function useProjectConfig(id?: string): ProjectConfig {
  const current = useCurrentProject();
  const pid = id ?? current.id;
  const stored = useApp((s) => s.projectConfig[pid]);
  return stored ?? DEMO_CONFIG[pid] ?? emptyConfig();
}
