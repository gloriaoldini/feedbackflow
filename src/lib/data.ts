import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_FEATURES, demoFeedback, type FeatureRequest, type FeedbackItem } from "./demo-data";
import { store, useApp, type Destination } from "./store";
import { useCurrentProject } from "./projects";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

/** Demo mode when Supabase isn't configured, or when the visitor chose "Explore the demo". */
export function isDemoMode() {
  return !isSupabaseConfigured || store.get().demo;
}

export function useDemoMode() {
  const demo = useApp((s) => s.demo);
  return !isSupabaseConfigured || demo;
}

/** Feedback for the current project only. */
export function useFeedback() {
  const demo = useDemoMode();
  const project = useCurrentProject().id;
  return useQuery({
    queryKey: ["feedback", demo, project],
    queryFn: async (): Promise<FeedbackItem[]> => {
      if (demo) return demoFeedback().filter((f) => f.project_id === project);
      // Real mode: after running supabase/migrations/*_projects.sql, add
      // .eq("project_id", project) once projects are loaded from the DB.
      const { data, error } = await supabase
        .from("feedback_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((d) => ({
        id: d.id,
        source: d.source,
        author: d.author ?? "Unknown",
        original_text: d.original_text,
        summary: d.summary ?? "",
        sentiment: d.sentiment ?? "neutral",
        topic: d.topic ?? "feature_request",
        urgency: d.urgency,
        is_feature_request: d.is_feature_request,
        created_at: d.created_at,
        project_id: project,
      })) as FeedbackItem[];
    },
    staleTime: 60_000,
  });
}

export function useFeatures() {
  const demo = useDemoMode();
  const project = useCurrentProject().id;
  return useQuery({
    queryKey: ["features", demo, project],
    queryFn: async (): Promise<FeatureRequest[]> => {
      if (demo) return DEMO_FEATURES.filter((f) => f.project_id === project).sort((a, b) => b.mention_count - a.mention_count);
      const { data, error } = await supabase
        .from("feature_requests_aggregated")
        .select("*")
        .order("mention_count", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d) => ({
        id: d.id,
        topic_name: d.topic_name,
        mention_count: d.mention_count,
        jira_ticket_url: d.jira_ticket_url,
        project_id: project,
      }));
    },
    staleTime: 60_000,
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends a summary to Jira / Linear. In demo mode this is simulated;
 * wire your real API (edge function / webhook) in the marked spot.
 */
export async function sendToTracker(kind: "feedback" | "feature", id: string, dest: Destination) {
  await wait(650);
  // TODO(real mode): call your Jira/Linear integration here.
  if (kind === "feedback") store.set((s) => ({ sent: { ...s.sent, [id]: dest } }));
  else store.set((s) => ({ sentFeatures: { ...s.sentFeatures, [id]: dest } }));
}

export function undoSend(kind: "feedback" | "feature", id: string) {
  store.set((s) => {
    const key = kind === "feedback" ? "sent" : "sentFeatures";
    const next = { ...s[key] };
    delete next[id];
    return { [key]: next };
  });
}

/** Builds a day-by-day sentiment series for the last `days` days. */
export function sentimentSeries(items: FeedbackItem[], days = 14, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const rows = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      key: d.toDateString(),
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      positive: 0,
      neutral: 0,
      negative: 0,
    };
  });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const it of items) {
    const row = byKey.get(new Date(it.created_at).toDateString());
    if (row) row[it.sentiment] += 1;
  }
  return rows;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
