/**
 * Demo dataset — mirrors the Supabase seed in supabase/migrations so the
 * app is fully navigable without an account (portfolio / GitHub demo).
 */
export type Source = "slack" | "intercom" | "gmail";
export type Sentiment = "positive" | "neutral" | "negative";
export type Topic =
  | "feature_request" | "bug" | "ux" | "pricing" | "docs" | "performance" | "billing" | "security";
export type Urgency = "low" | "medium" | "high";

export interface FeedbackItem {
  id: string;
  source: Source;
  author: string;
  original_text: string;
  summary: string;
  sentiment: Sentiment;
  topic: Topic;
  urgency: Urgency;
  is_feature_request: boolean;
  created_at: string;
  project_id: string;
}

export interface FeatureRequest {
  id: string;
  topic_name: string;
  mention_count: number;
  jira_ticket_url: string | null;
  project_id: string;
}

const RAW: [Source, string, string, Sentiment, Topic, Urgency, boolean, string][] = [
  ["slack", "Sarah Chen", "Would absolutely love a dark mode option, my eyes are dying at night.", "positive", "feature_request", "low", true, "Requests dark mode for late-night usage"],
  ["intercom", "Marcus Wong", "Search in the Help Center never finds anything. I typed 'export' and got zero results.", "negative", "docs", "high", true, "Help Center search returns no results"],
  ["gmail", "Priya Sharma", "Slack notifications when a customer leaves negative feedback would be huge.", "positive", "feature_request", "medium", true, "Wants Slack alerts on negative feedback"],
  ["slack", "Diego Torres", "Dashboard is crashing on Safari 17. Blocking our QA team.", "negative", "bug", "high", false, "Safari 17 dashboard crash blocking QA"],
  ["intercom", "Anna Volkov", "Loving the new sentiment analysis, really helps prioritize.", "positive", "ux", "low", false, "Praises sentiment analysis feature"],
  ["gmail", "Tom Becker", "Pricing page is confusing. What's the difference between Pro and Business?", "neutral", "pricing", "low", false, "Confused about Pro vs Business tiers"],
  ["slack", "Yuki Tanaka", "Dark mode please! Working nights and the white is brutal.", "neutral", "feature_request", "low", true, "Another dark mode request"],
  ["intercom", "James O'Connor", "The Slack setup article was exactly what I needed. Done in 5 minutes.", "positive", "docs", "low", false, "Slack setup guide was helpful"],
  ["gmail", "Fatima Al-Hassan", "Performance is awful on the feedback list page when we have >500 items.", "negative", "performance", "medium", false, "Slow feedback list at scale"],
  ["slack", "Robert Kim", "Billing charged me twice this month. Need a refund ASAP.", "negative", "billing", "high", false, "Double charge — needs urgent refund"],
  ["intercom", "Eva Lindqvist", "The new docs are 10x better. Found what I needed in 30 seconds.", "positive", "docs", "low", false, "Loves the new documentation"],
  ["gmail", "Hassan Mehta", "Screenshots in the integrations guide are from the old design. Very confusing.", "neutral", "docs", "medium", true, "Integration guide has outdated screenshots"],
  ["slack", "Linda Park", "Help Center search is useless, I had to email support for a basic question.", "negative", "docs", "high", true, "Search fails, user had to contact support"],
  ["intercom", "Carlos Mendez", "UI feels cluttered, especially the dashboard. Less is more?", "negative", "ux", "low", false, "Dashboard feels cluttered"],
  ["gmail", "Olivia Brown", "Dark mode would be game-changing. Third time asking!", "negative", "feature_request", "medium", true, "Repeated dark mode request"],
  ["slack", "Akira Nakamura", "Slack integration for alerts is what would push us to Pro.", "positive", "feature_request", "medium", true, "Slack alerts would drive upgrade"],
  ["intercom", "Sophie Laurent", "Search filters are clunky. Add date range plz.", "neutral", "ux", "low", false, "Wants date range filters in search"],
  ["gmail", "David Cohen", "Is there an article on how billing works for extra seats? Couldn't find one.", "neutral", "pricing", "low", false, "Can't find billing info for extra seats"],
  ["slack", "Mei Lin", "Feature requests view is gold. Knowing top asks is helping us roadmap.", "positive", "ux", "low", false, "Loves feature request aggregation"],
  ["intercom", "Noah Williams", "Crashed when uploading CSV >10MB. Lost our import.", "negative", "bug", "high", false, "CSV upload crashes on large files"],
  ["gmail", "Isabel Rodriguez", "Slack notifications for feature requests would be SO useful.", "positive", "feature_request", "low", true, "Slack alerts for feature requests"],
  ["slack", "Lucas Schmidt", "Onboarding was smooth, got value in 5 min. Well done.", "positive", "ux", "low", false, "Praises quick onboarding"],
  ["intercom", "Aisha Patel", "Searched 'Jira' and got nothing, even though there is an article about it.", "negative", "docs", "high", true, "Search misses existing Jira article"],
  ["gmail", "Ethan Carter", "A short onboarding video would help our new hires a lot.", "neutral", "feature_request", "low", true, "Wants video tutorials"],
  ["slack", "Grace Hu", "Mobile app when??", "neutral", "feature_request", "low", true, "Asks about mobile app"],
  ["intercom", "Ben Foster", "Annual plan discount would seal the deal for us.", "neutral", "pricing", "low", false, "Asks about annual discount"],
  ["gmail", "Chloe Martin", "Page load on dashboard takes 4-5s. Too slow.", "negative", "performance", "medium", false, "Slow dashboard load times"],
  ["slack", "Ravi Iyer", "Loving this tool. Replaced 3 spreadsheets already.", "positive", "ux", "low", false, "Replaced multiple spreadsheets"],
  ["intercom", "Hannah Schultz", "SSO via SAML is a hard requirement for our security team.", "neutral", "security", "high", true, "SAML SSO required for security"],
  ["gmail", "Felix Andersson", "Just upgraded to Pro. Worth every penny so far!", "positive", "pricing", "low", false, "Happy customer after Pro upgrade"],
];

/* Northwind Labs · Insights Hub (second workspace) */
const NORTHWIND: [Source, string, string, Sentiment, Topic, Urgency, boolean, string][] = [
  ["slack", "Maya Okafor", "Scheduled reports keep arriving an hour late since the DST change.", "negative", "bug", "high", false, "Scheduled reports delayed after DST"],
  ["intercom", "Jonas Weber", "Would love to share a dashboard with a public link for our board.", "positive", "feature_request", "medium", true, "Wants public share links for dashboards"],
  ["gmail", "Leila Haddad", "The new chart builder is so much faster. Great work!", "positive", "ux", "low", false, "Praises new chart builder speed"],
  ["slack", "Tomás Rivera", "CSV export cuts off at 10k rows. We need full exports.", "negative", "feature_request", "high", true, "CSV export limited to 10k rows"],
  ["intercom", "Ingrid Holm", "Is SSO available on the Starter plan?", "neutral", "pricing", "low", false, "Asks about SSO on Starter"],
  ["gmail", "Kenji Sato", "Dark mode for dashboards would help our night shift.", "neutral", "feature_request", "low", true, "Requests dark mode for dashboards"],
  ["slack", "Amara Nwosu", "Filters reset every time I switch tabs. Super annoying.", "negative", "ux", "medium", false, "Filters reset when switching tabs"],
  ["intercom", "Pablo Ruiz", "Public share links would let us drop our PDF exports.", "positive", "feature_request", "low", true, "Another request for public share links"],
];

/** Which Acme project each seed message belongs to (by index). */
const PROJECT_OF = [
  "web", "api", "web", "web", "web", "web", "web", "api", "web", "web",
  "web", "api", "api", "web", "mobile", "web", "web", "api", "web", "mobile",
  "web", "web", "api", "api", "mobile", "web", "web", "web", "web", "web",
];

/** Spread the demo items over the last 14 days (newest first) so trends read naturally. */
const HOURS_AGO = [0.2, 1, 2, 3, 4, 5, 9, 14, 20, 26, 31, 40, 52, 60, 75, 88, 100, 118, 130, 150, 170, 190, 210, 230, 250, 270, 290, 300, 315, 330];

export function demoFeedback(now = Date.now()): FeedbackItem[] {
  const acme = RAW.map((r, i) => ({
    id: `demo-${i + 1}`,
    project_id: PROJECT_OF[i],
    source: r[0],
    author: r[1],
    original_text: r[2],
    sentiment: r[3],
    topic: r[4],
    urgency: r[5],
    is_feature_request: r[6],
    summary: r[7],
    created_at: new Date(now - HOURS_AGO[i] * 3600_000).toISOString(),
  }));
  const nw = NORTHWIND.map((r, i) => ({
    id: `nw-${i + 1}`,
    project_id: "insights-hub",
    source: r[0], author: r[1], original_text: r[2], sentiment: r[3], topic: r[4], urgency: r[5], is_feature_request: r[6], summary: r[7],
    created_at: new Date(now - (i * 30 + 2) * 3600_000).toISOString(),
  }));
  return [...acme, ...nw];
}

export const DEMO_FEATURES: FeatureRequest[] = [
  { id: "fr-1", project_id: "web", topic_name: "Dark mode", mention_count: 12, jira_ticket_url: null },
  { id: "fr-3", project_id: "web", topic_name: "Slack notifications", mention_count: 7, jira_ticket_url: null },
  { id: "fr-5", project_id: "web", topic_name: "SAML SSO", mention_count: 4, jira_ticket_url: null },
  { id: "fr-7", project_id: "web", topic_name: "Date range filters", mention_count: 3, jira_ticket_url: null },
  { id: "fr-2", project_id: "api", topic_name: "Better Help Center search", mention_count: 9, jira_ticket_url: null },
  { id: "fr-4", project_id: "api", topic_name: "Updated screenshots", mention_count: 5, jira_ticket_url: null },
  { id: "fr-8", project_id: "api", topic_name: "Video tutorials", mention_count: 3, jira_ticket_url: null },
  { id: "fr-9", project_id: "mobile", topic_name: "Dark mode", mention_count: 6, jira_ticket_url: null },
  { id: "fr-10", project_id: "mobile", topic_name: "Push notifications", mention_count: 5, jira_ticket_url: null },
  { id: "fr-6", project_id: "mobile", topic_name: "Native mobile app", mention_count: 3, jira_ticket_url: null },
  { id: "fr-11", project_id: "insights-hub", topic_name: "Public share links", mention_count: 8, jira_ticket_url: null },
  { id: "fr-12", project_id: "insights-hub", topic_name: "Full CSV export", mention_count: 5, jira_ticket_url: null },
  { id: "fr-13", project_id: "insights-hub", topic_name: "Dark mode for dashboards", mention_count: 2, jira_ticket_url: null },
];

export const TOPIC_LABEL: Record<Topic, string> = {
  feature_request: "Feature request",
  bug: "Bug",
  ux: "UX",
  pricing: "Pricing",
  docs: "Docs",
  performance: "Performance",
  billing: "Billing",
  security: "Security",
};

export const SOURCE_LABEL: Record<Source, string> = { slack: "Slack", intercom: "Intercom", gmail: "Gmail" };

export function timeAgo(iso: string, now = Date.now()) {
  const m = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function timeAgoLong(iso: string, now = Date.now()) {
  const m = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

/** Which messages ask for the same thing (AI clustering, rule-based in the demo). */
const FEATURE_MATCH: Record<string, RegExp> = {
  "Dark mode": /dark mode/i,
  "Slack notifications": /slack (notification|alert|integration for alert)/i,
  "SAML SSO": /\bsso\b|saml/i,
  "Date range filters": /date range/i,
  "Better Help Center search": /search/i,
  "Updated screenshots": /screenshot/i,
  "Video tutorials": /video/i,
  "Push notifications": /push notification/i,
  "Native mobile app": /mobile app/i,
  "Public share links": /share link|public link/i,
  "Full CSV export": /csv/i,
  "Dark mode for dashboards": /dark mode/i,
};

export function featureFor(item: FeedbackItem, features: FeatureRequest[]) {
  return features.find((f) => f.project_id === item.project_id && FEATURE_MATCH[f.topic_name]?.test(item.original_text));
}

/** Messages grouped under a feature request. */
export function askersOf(feature: FeatureRequest, items: FeedbackItem[]) {
  return items.filter((i) => i.project_id === feature.project_id && FEATURE_MATCH[feature.topic_name]?.test(i.original_text));
}
