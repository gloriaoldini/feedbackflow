import { useSyncExternalStore } from "react";
import type { Project, ProjectConfig } from "./projects";

/**
 * Small persisted client store (localStorage) for UI + demo state.
 * SSR-safe: the server always renders DEFAULTS, the client swaps in the
 * saved state after hydration (useSyncExternalStore handles the switch).
 */
export type Theme = "light" | "dark" | "system";
export type Destination = "Jira" | "Linear";
export type IntegrationId = "slack" | "intercom" | "gmail" | "jira" | "linear" | "github" | "figma";

export interface AppState {
  demo: boolean;
  onboarded: boolean;
  tourDone: boolean;
  theme: Theme;
  profileName: string;
  email: string;
  workspaceSlug: string;
  favourites: string[];
  archived: string[];
  addressed: string[];
  summaries: Record<string, string>;
  sent: Record<string, Destination>;
  sentFeatures: Record<string, Destination>;
  notifications: Record<string, boolean>;
  /** Close the loop: request id → number of customers notified when it shipped. */
  shipped: Record<string, number>;
  digestDay: string;
  topics: string[];
  /* workspaces & projects */
  workspaceId: string;
  projectId: string;
  workspaceNames: Record<string, string>;
  customProjects: Project[];
  archivedProjects: string[];
  projectOverrides: Record<string, Partial<Pick<Project, "name" | "color" | "description">>>;
  projectConfig: Record<string, ProjectConfig>;
}

export const DEFAULTS: AppState = {
  demo: false,
  onboarded: false,
  tourDone: false,
  theme: "light",
  profileName: "Jane Doe",
  email: "jane@company.com",
  workspaceSlug: "acme",
  favourites: [],
  archived: [],
  addressed: [],
  summaries: {},
  sent: {},
  sentFeatures: {},
  notifications: { digest: true, urgent: true, trending: false },
  shipped: {},
  digestDay: "Monday",
  topics: ["feature request", "bug", "UX", "pricing"],
  workspaceId: "acme",
  projectId: "web",
  workspaceNames: {},
  customProjects: [],
  archivedProjects: [],
  projectOverrides: {},
  projectConfig: {},
};

const KEY = "fbf_state_v2";
let state: AppState = DEFAULTS;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULTS, ...JSON.parse(raw) };
    // migrate the old onboarding flag
    if (window.localStorage.getItem("fbf_onboarded")) state = { ...state, onboarded: true };
  } catch {
    /* storage unavailable: keep defaults */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const store = {
  get: () => state,
  set(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    if (typeof window !== "undefined") persist();
    listeners.forEach((l) => l());
  },
  reset() {
    state = { ...DEFAULTS };
    if (typeof window !== "undefined") persist();
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useApp<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(state),
    () => select(DEFAULTS),
  );
}

/** Toggle an id inside one of the list fields (favourites, archived, addressed). */
export function toggleIn(key: "favourites" | "archived" | "addressed", id: string) {
  store.set((s) => {
    const list = s[key];
    return { [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } as Partial<AppState>;
  });
}

/* ---------- Theme ---------- */
export function resolveTheme(t: Theme) {
  if (t !== "system") return t;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveTheme(t) === "dark");
}

/** Runs before paint (inlined in <head>) to avoid a light flash in dark mode. */
export const THEME_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem("${KEY}")||"{}");var t=s.theme||"light";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;
