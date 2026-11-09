import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/data";
import { applyTheme, store, THEME_BOOT_SCRIPT, useApp, resolveTheme } from "@/lib/store";
import { Logo } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-panel px-4 text-center">
      <Logo withText={false} size={40} />
      <div className="max-w-md">
        <p className="text-overline text-muted-foreground">Error 404</p>
        <h1 className="mt-2 text-h1">
          This page went <em className="serif-accent">missing</em>
        </h1>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-h2">This page didn't load</h1>
        <p className="mt-2 text-muted-foreground">Something went wrong on our end. Try again, or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button asChild variant="secondary">
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FeedBackFlow — AI customer feedback for product teams" },
      {
        name: "description",
        content:
          "Collect customer feedback from Slack, Intercom and Gmail. AI tags it, ranks the top requests and sends them to Jira or Linear.",
      },
      { name: "author", content: "FeedBackFlow" },
      { name: "theme-color", content: "#FBF8F4" },
      { property: "og:title", content: "FeedBackFlow — Stop guessing what users want" },
      { property: "og:description", content: "AI-powered customer feedback for product teams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: `${import.meta.env.BASE_URL}favicon.png` },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const theme = useApp((s) => s.theme);
  const isDark = useApp((s) => resolveTheme(s.theme) === "dark");

  // Keep <html class="dark"> in sync with the saved theme (and the OS when "system").
  useEffect(() => {
    applyTheme(store.get().theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => store.get().theme === "system" && applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="top-right"
        theme={isDark ? "dark" : "light"}
        toastOptions={{
          classNames: {
            toast: "!rounded-xl !border !border-border !bg-card !text-foreground !shadow-pop !font-sans",
            description: "!text-muted-foreground",
          },
        }}
      />
    </QueryClientProvider>
  );
}
