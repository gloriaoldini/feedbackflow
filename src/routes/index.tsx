import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, FolderKanban, Hash, Mail, MessageCircle, Send, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentimentChart } from "@/components/SentimentChart";
import { Logo, ThemeToggle } from "@/components/app/primitives";
import { cn } from "@/lib/utils";
import { ClientOnly } from "@/components/ClientOnly";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FeedBackFlow — Stop guessing what your users want" },
      { name: "description", content: "Collect feedback from Slack, Intercom and Gmail. AI ranks what customers ask for most and sends it to Jira or Linear in one click." },
    ],
  }),
  component: Landing,
});

const LOGOS = ["Linear", "Notion", "Vercel", "Stripe"];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/" aria-label="FeedBackFlow home"><Logo /></Link>
          <nav aria-label="Main" className="hidden items-center gap-7 text-[14px] text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block"><ClientOnly fallback={<span className="block h-7 w-12" />}><ThemeToggle variant="header" /></ClientOnly></span>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/login" search={{ mode: "signin" }}>Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/login" search={{ mode: "signup" }}>Start free trial</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-panel">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-16 text-center md:px-6 md:pb-24 md:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-[12.5px] text-muted-foreground animate-fade-up">
            <span className="size-1.5 rounded-full bg-chart-pos" aria-hidden="true" /> 14-day free trial · no credit card
          </span>
          <h1 className="text-display max-w-4xl text-balance animate-fade-up">
            Stop guessing <span className="block font-serif font-normal italic tracking-normal text-brand">what users want.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-7 text-muted-foreground md:text-[19px] md:leading-8">
            FeedBackFlow collects feedback from Slack, Intercom and email, then uses AI to rank what customers ask for most. Send it to Jira or Linear in one click.
          </p>
          <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg"><Link to="/login" search={{ mode: "signup" }}>Start free trial <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/demo">Explore the live demo</Link></Button>
          </div>
          <div className="mt-12 flex flex-col items-center gap-4">
            <span className="text-overline text-muted-foreground">Trusted by 500+ product teams</span>
            <div className="flex flex-wrap justify-center gap-x-9 gap-y-3 text-[20px] font-bold tracking-[-0.02em] text-ink-subtle">
              {LOGOS.map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>

          <div className="group relative mt-14 w-full max-w-5xl rounded-2xl border border-border bg-card/70 p-2 shadow-pop backdrop-blur md:mt-20">
            <div className="flex items-center gap-1.5 px-3 pb-2 pt-1">
              <span className="size-2.5 rounded-full bg-input" aria-hidden="true" /><span className="size-2.5 rounded-full bg-input" aria-hidden="true" /><span className="size-2.5 rounded-full bg-input" aria-hidden="true" />
              <span className="ml-3 hidden truncate rounded-md bg-muted px-3 py-0.5 text-[12px] text-muted-foreground sm:block">app.feedbackflow.app/dashboard</span>
              <Link to="/demo" className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12.5px] font-medium text-primary-ink hover:bg-primary-soft">
                Open live demo <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-xl bg-background p-3 md:p-5">
              <ClientOnly fallback={<div className="h-[300px]" />}><SentimentChart /></ClientOnly>
            </div>
          </div>
          <p className="mt-4 text-caption text-muted-foreground">No sign-up needed: the demo runs on sample data from 3 products.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="text-overline text-primary-ink">How it works</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[38px] tracking-[-0.03em] md:text-[44px] md:leading-[50px]">
            From scattered messages to a <em className="serif-accent">roadmap</em>
          </h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { icon: MessageCircle, title: "Collect", body: "Connect Slack channels, Intercom tags and a Gmail address. Every product gets its own project and inbox." },
            { icon: Sparkles, title: "Understand", body: "AI labels each message by sentiment, topic and urgency, then groups recurring asks into ranked requests." },
            { icon: Send, title: "Ship", body: "Review the AI summary, edit if needed and send it to Jira or Linear with a link back to the customer." },
          ].map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-card md:p-7">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-ink"><s.icon className="size-5" aria-hidden="true" /></span>
                <span className="tabular text-overline text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="text-h2">{s.title}</h3>
              <p className="text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-y border-border bg-sidebar">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mb-12 max-w-2xl md:mb-16">
            <p className="text-overline text-primary-ink">Features</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[38px] tracking-[-0.03em] md:text-[44px] md:leading-[50px]">
              Built for product managers who <em className="serif-accent">ship</em>
            </h2>
            <p className="mt-4 text-lead text-muted-foreground">No more spreadsheets. No more guessing.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: TrendingUp, title: "AI sentiment analysis", desc: "Every message is tagged with sentiment, topic and urgency in seconds, so you see what's on fire at a glance." },
              { icon: Sparkles, title: "Top feature requests", desc: "Similar asks are grouped and ranked by mentions. Send any of them to your tracker straight from the list." },
              { icon: Hash, title: "Slack, Intercom & email", desc: "One inbox for everything customers say, from every channel, with replies sent back where they came from." },
              { icon: FolderKanban, title: "One project per product", desc: "Running several products? Each gets its own inbox, insights and Jira or Linear destination. Switch in one click." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-ink-2"><f.icon className="size-5" aria-hidden="true" /></span>
                <div>
                  <h3 className="text-h3">{f.title}</h3>
                  <p className="mt-1 text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] text-muted-foreground">
            <span className="text-overline">Works with</span>
            {[[Hash, "Slack"], [MessageCircle, "Intercom"], [Mail, "Gmail"], [Send, "Jira"], [Check, "Linear"]].map(([I, n]) => {
              const Icon = I as typeof Hash;
              return <span key={n as string} className="inline-flex items-center gap-1.5 font-medium text-ink-2"><Icon className="size-4" aria-hidden="true" />{n as string}</span>;
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-overline text-primary-ink">Pricing</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[38px] tracking-[-0.03em] md:text-[44px] md:leading-[50px]">Simple <em className="serif-accent">pricing</em></h2>
          <p className="mt-4 text-lead text-muted-foreground">Start free for 14 days. Cancel anytime.</p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            { name: "Starter", price: 49, features: ["1 project", "1 source", "500 feedback / mo", "Basic AI analysis", "Email support"] },
            { name: "Pro", price: 99, popular: true, features: ["5 projects", "3 sources", "5,000 feedback / mo", "Advanced AI", "Jira & Linear export", "Priority support"] },
            { name: "Business", price: 299, features: ["Unlimited projects", "Unlimited sources", "Unlimited feedback", "Custom AI prompts", "SAML SSO", "Dedicated CSM"] },
          ].map((t) => (
            <div key={t.name} className={cn("relative flex flex-col rounded-2xl border bg-card p-7 shadow-card", t.popular ? "border-primary shadow-[0_0_0_3px_oklch(0.586_0.192_20/0.12)]" : "border-border")}>
              {t.popular && <span className="absolute -top-3 left-7 rounded-full bg-primary bg-button px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">Most popular</span>}
              <h3 className="text-h2">{t.name}</h3>
              <p className="mb-6 mt-2"><span className="text-[44px] font-semibold tracking-[-0.03em]">${t.price}</span><span className="text-muted-foreground"> / month</span></p>
              <ul className="mb-8 flex flex-col gap-2.5">
                {t.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-pos-fg" aria-hidden="true" />{f}</li>)}
              </ul>
              <Button asChild variant={t.popular ? "default" : "secondary"} className="mt-auto w-full">
                <Link to="/login" search={{ mode: "signup" }}>Start free trial</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 pb-20 md:px-6 md:pb-28">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 rounded-3xl bg-panel px-6 py-14 text-center md:py-20">
          <h2 className="max-w-2xl text-[30px] font-semibold leading-9 tracking-[-0.03em] md:text-[40px] md:leading-[46px]">
            Know what to build <em className="serif-accent">next week</em>
          </h2>
          <p className="max-w-xl text-lead text-muted-foreground">Connect your first source in two minutes. Your top requests are ready before your next planning meeting.</p>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg"><Link to="/login" search={{ mode: "signup" }}>Start free trial <ArrowRight /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link to="/demo">Explore the live demo</Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-[14px] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <Logo size={24} />
          <nav aria-label="Footer" className="flex flex-wrap gap-6">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link to="/demo" className="hover:text-foreground">Live demo</Link>
            <Link to="/login" search={{ mode: "signin" }} className="hover:text-foreground">Sign in</Link>
          </nav>
          <p>© 2026 FeedBackFlow</p>
        </div>
      </footer>
    </div>
  );
}
