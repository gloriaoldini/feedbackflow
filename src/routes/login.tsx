import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo, Segmented, SentimentTag, ThemeToggle, TopicTag } from "@/components/app/primitives";
import { isSupabaseConfigured } from "@/lib/data";
import { store } from "@/lib/store";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in · FeedBackFlow" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined" || !isSupabaseConfigured) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

type Mode = "signin" | "signup" | "forgot" | "sent";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [tried, setTried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentFor, setSentFor] = useState<"signup" | "reset">("signup");

  useEffect(() => { if (search.mode) setMode(search.mode); }, [search.mode]);

  const emailError = tried && !EMAIL_RE.test(email) ? "Enter a valid work email, like jane@company.com" : "";
  const pwError = tried && mode !== "forgot" && password.length < 8 ? "Use at least 8 characters" : "";

  const enterDemo = () => {
    store.set({ demo: true, email: email || "jane@company.com", profileName: fullName || store.get().profileName });
    navigate({ to: store.get().onboarded ? "/dashboard" : "/onboarding" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!EMAIL_RE.test(email) || (mode !== "forgot" && password.length < 8)) return;
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await new Promise((r) => setTimeout(r, 500));
        if (mode === "forgot") { setSentFor("reset"); setMode("sent"); return; }
        enterDemo();
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin + "/onboarding" },
        });
        if (error) throw error;
        if (!data.session) { setSentFor("signup"); setMode("sent"); return; }
        store.set({ demo: false, email, profileName: fullName || email.split("@")[0] });
        navigate({ to: "/onboarding" });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        store.set({ demo: false, email });
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/login" });
        if (error) throw error;
        setSentFor("reset");
        setMode("sent");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    if (!isSupabaseConfigured) return enterDemo();
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="flex flex-col bg-background px-5 py-4 md:bg-panel md:px-8 md:py-8 lg:bg-background lg:px-12">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="FeedBackFlow home"><Logo /></Link>
          <ThemeToggle variant="header" />
        </div>

        <div className="mx-auto my-auto flex w-full max-w-[400px] flex-col gap-6 py-8 md:max-w-[480px] md:rounded-2xl md:border md:border-border md:bg-card md:p-10 md:shadow-pop lg:max-w-[400px] lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {mode === "sent" ? (
            <div className="flex flex-col items-start gap-4 animate-fade-up">
              <span className="flex size-12 items-center justify-center rounded-xl bg-pos-bg text-pos-fg"><MailCheck className="size-6" aria-hidden="true" /></span>
              <h1 className="text-h1-sm md:text-h1">Check your <em className="serif-accent">inbox</em></h1>
              <p className="text-lead text-muted-foreground">
                We sent a {sentFor === "signup" ? "confirmation" : "password reset"} link to <b className="font-semibold text-foreground">{email}</b>. It expires in 1 hour.
              </p>
              <Button variant="secondary" onClick={() => setMode("signin")}><ArrowLeft /> Back to sign in</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <h1 className="text-h1-sm md:text-h1">
                  {mode === "signup" && <>Start your free <em className="serif-accent">trial</em></>}
                  {mode === "signin" && <>Welcome <em className="serif-accent">back</em></>}
                  {mode === "forgot" && <>Reset your <em className="serif-accent">password</em></>}
                </h1>
                <p className="text-[15px] text-muted-foreground">
                  {mode === "signup" && "14 days of Pro, no card required."}
                  {mode === "signin" && "Sign in to your team."}
                  {mode === "forgot" && "Enter your work email and we'll send you a reset link."}
                </p>
              </div>

              {mode !== "forgot" && (
                <>
                  <Segmented
                    label="Choose sign in or sign up"
                    value={mode}
                    onChange={(m) => { setMode(m); setTried(false); }}
                    items={[{ value: "signin", label: "Sign in" }, { value: "signup", label: "Create account" }]}
                    className="grid w-full grid-cols-2 [&>button]:justify-center"
                  />
                  <div className="flex flex-col gap-2.5">
                    <Button variant="secondary" size="lg" className="w-full" onClick={google} type="button">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07Z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" /><path fill="#FBBC05" d="M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.12V7.04H2.18a11 11 0 0 0 0 9.92l3.66-2.84Z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" /></svg>
                      Continue with Google
                    </Button>
                    <Button variant="soft" size="lg" className="w-full" onClick={enterDemo} type="button">
                      Explore the live demo <ArrowRight />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-input" />
                    <span className="text-caption text-muted-foreground">or with email</span>
                    <span className="h-px flex-1 bg-input" />
                  </div>
                </>
              )}

              <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-[13px] font-medium">Full name</label>
                    <Input id="name" className="h-11" autoComplete="name" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[13px] font-medium">Work email</label>
                  <Input id="email" className="h-11" type="email" autoComplete="email" placeholder="jane@company.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError} aria-describedby={emailError ? "email-err" : undefined} />
                  {emailError && <FieldError id="email-err">{emailError}</FieldError>}
                </div>
                {mode !== "forgot" && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="pw" className="text-[13px] font-medium">Password</label>
                      {mode === "signin" && <button type="button" onClick={() => { setMode("forgot"); setTried(false); }} className="text-[13px] font-medium text-primary-ink hover:underline">Forgot password?</button>}
                    </div>
                    <div className="relative">
                      <Input id="pw" className="h-11 pr-16" type={showPw ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!pwError} aria-describedby={pwError ? "pw-err" : undefined} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-1.5 top-1.5 h-8" onClick={() => setShowPw(!showPw)} aria-pressed={showPw}>
                        {showPw ? "Hide" : "Show"}
                      </Button>
                    </div>
                    {pwError && <FieldError id="pw-err">{pwError}</FieldError>}
                  </div>
                )}
                <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
                  {loading && <Loader2 className="animate-spin" />}
                  {mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
                </Button>
                {mode === "forgot" && (
                  <Button type="button" variant="ghost" onClick={() => setMode("signin")}><ArrowLeft /> Back to sign in</Button>
                )}
              </form>
              <p className="text-center text-caption leading-[18px] text-muted-foreground">
                By continuing you agree to our <a href="#terms" className="font-medium text-primary-ink hover:underline">Terms</a> and <a href="#privacy" className="font-medium text-primary-ink hover:underline">Privacy Policy</a>.
              </p>
            </>
          )}
        </div>
      </section>

      <aside className="hidden flex-col justify-between gap-10 border-l border-border bg-panel p-14 lg:flex" aria-label="About FeedBackFlow">
        <div className="flex max-w-[520px] flex-col gap-4">
          <span className="text-overline text-primary-ink">Feedback → summary → ticket</span>
          <p className="text-[44px] font-semibold leading-[48px] tracking-[-0.035em]">Stop guessing <em className="serif-accent">what users want.</em></p>
          <p className="max-w-[440px] text-lead text-muted-foreground">Pull feedback from Slack, Intercom and Gmail into one inbox per product, and send the requests that matter to Jira or Linear in one click.</p>
        </div>
        <div className="flex max-w-[460px] flex-col gap-3">
          <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-pop">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">SC</span>
              <span className="text-[13px] font-semibold">Sarah Chen</span>
              <span className="text-caption text-muted-foreground">· Slack</span>
              <span className="ml-auto flex gap-1.5"><SentimentTag value="positive" /><TopicTag value="feature_request" /></span>
            </div>
            <p>Would absolutely love a dark mode option, my eyes are dying at night.</p>
          </div>
          <div className="ml-8 flex flex-col gap-3 rounded-xl border border-ai-bd bg-ai-bg p-4 shadow-pop">
            <span className="text-overline text-primary-ink">AI summary</span>
            <p className="text-[15px] font-medium">Requests dark mode for late-night usage</p>
            <div className="flex items-center gap-2.5 rounded-lg border border-pos-bd bg-pos-bg px-3 py-2 text-[13px] font-semibold text-pos-fg">
              <span className="flex size-5 items-center justify-center rounded-full bg-chart-pos"><Check className="size-3 text-white" strokeWidth={3} /></span>
              Sent to Jira · WEB
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <span className="text-overline text-muted-foreground">Trusted by 500+ product teams</span>
          <div className="flex flex-wrap gap-7 text-[20px] font-bold tracking-[-0.02em] text-ink-subtle">
            <span>Linear</span><span>Notion</span><span>Vercel</span><span>Stripe</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} role="alert" className="flex items-center gap-1.5 text-[12.5px] leading-[18px] text-neg-fg">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> {children}
    </span>
  );
}
