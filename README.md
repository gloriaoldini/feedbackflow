# FeedBackFlow

**Stop guessing what users want.** FeedBackFlow pulls customer feedback from Slack, Intercom and Gmail into one inbox per product. AI tags each message by sentiment, topic and urgency, ranks the most-requested features, and sends a short summary to Jira or Linear in one click.

> Portfolio project by Gloria Oldini: product design (UX/UI, design system) and front-end.

## Try it

- **Landing page:** `/` (on GitHub Pages: `https://<your-user>.github.io/<repo>/`)
- **Live demo:** `/demo`. No sign-up: it opens a demo workspace with sample data from 3 products (Web App, Mobile App, Public API) plus a second workspace (Northwind Labs).

The demo is fully navigable. You can:

- Follow onboarding, then the first-access guided tour.
- Use Ask AI (rule-based in the demo).
- Open feedback, edit the AI summary and send it to Jira or Linear (simulated), with undo.
- Filter, search, favourite, archive and reply in the Inbox.
- Switch between projects and workspaces, or create a new project and connect its sources.
- Manage integrations per project (source routing, default destination).
- Use Settings (profile, workspace, projects, notifications, appearance, billing).
- Switch between light, dark and system themes.

All demo changes persist in `localStorage`.

## Key flow

**Feedback → AI summary → Send to Jira / Linear.** This is the product's main success metric (requests sent per week). The Inbox detail panel shows it as three numbered steps, ending with an inline "Sent ✓" confirmation and an undo.

## Design system

- **Type:** Inter, with a fixed scale (`text-h1`, `text-h2`, `text-h3`, `text-body`, `text-caption`, `text-overline`, `text-kpi`). Instrument Serif italic is used for **one word per page title** only (`serif-accent`).
- **Color:** warm cream, coral and amber. Every color is an `oklch` token in `src/styles.css`, with a full dark theme. Text meets WCAG AA (body 16:1, muted 6.2:1, white on coral 4.6:1).
- **Fixed tag meanings:** topic = blue, positive = green, neutral = yellow, negative = pink-red, urgent = solid pink-red.
- **Components:** one button family (primary / secondary / ghost / soft / destructive) with hover, active, focus and disabled states. Also a segmented control, tags, cards, inputs and a sun/moon theme switch.
- **Responsive:**
  - Desktop: full sidebar.
  - Tablet: icon rail.
  - Mobile: top bar with project switcher, bottom tab bar, list → detail inbox, and the tour as a bottom sheet.

## Tech

React 19 · TanStack Start / Router / Query · Tailwind CSS v4 · Radix UI · Recharts · Supabase (optional).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

### Demo mode vs real mode

- **Without** `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`, the app runs in demo mode on the data in `src/lib/demo-data.ts`.
- **With** them, sign up / sign in uses Supabase auth, and feedback is read from the `feedback_items` and `feature_requests_aggregated` tables. The "Explore the live demo" button still works.
- **Projects:** `supabase/migrations/20261108120000_projects.sql` adds the `projects` table, the `project_id` columns and RLS policies, and backfills one project per workspace.

### Deploy to GitHub Pages (portfolio demo)

The repo includes `.github/workflows/deploy-pages.yml`. On every push to `main` it builds a static version (every route is prerendered) and publishes it.

1. Push the repo to GitHub (e.g. `feedbackflow`).
2. On GitHub, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main` (or go to **Actions → Deploy to GitHub Pages → Run workflow**).
4. The demo goes live at `https://<your-user>.github.io/<repo>/`. The direct demo link is `https://<your-user>.github.io/<repo>/demo`.

To build locally the same way:

```bash
BASE_PATH=/feedbackflow/ npm run build:pages   # output: dist/client
```

The Pages build always runs in demo mode (no Supabase keys needed).

### Deploy with a server (Cloudflare)

```bash
npm run build && npx wrangler deploy
```

## Structure

```
src/
  styles.css                 design tokens (light + dark), type scale, utilities
  lib/
    demo-data.ts             sample feedback + feature requests per project
    store.ts                 persisted UI / demo state, theme
    projects.ts              workspaces, projects, per-project sources & destination
    data.ts                  data hooks (demo or Supabase), send-to-tracker
  components/app/            AppShell pieces, charts, tour, project switcher, send controls
  routes/
    index.tsx                landing
    demo.tsx                 enters demo mode
    login.tsx                sign in / sign up / forgot password / check email
    onboarding.tsx           connect source → topics → ready
    _authenticated.tsx       app shell (sidebar · rail · mobile bars)
    _authenticated/          dashboard, inbox, insights, integrations, settings, projects/new
```
