import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Inbox, LayoutDashboard, LogOut, Plug, Settings, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode, useFeedback } from "@/lib/data";
import { store, useApp } from "@/lib/store";
import { Avatar, Logo, Skeleton, ThemeToggle } from "@/components/app/primitives";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectSwitcher } from "@/components/app/ProjectSwitcher";
import { CommandMenu, SearchTrigger } from "@/components/app/CommandMenu";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    if (isDemoMode()) {
      // Demo: deep links (e.g. from a portfolio) open directly. /demo starts with onboarding.
      if (!store.get().onboarded) store.set({ onboarded: true });
      return;
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    if (!store.get().onboarded) throw redirect({ to: "/onboarding" });
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { to: "/inbox", label: "Inbox", short: "Inbox", icon: Inbox },
  { to: "/insights", label: "Insights", short: "Insights", icon: Sparkles },
  { to: "/integrations", label: "Integrations", short: "Apps", icon: Plug },
  { to: "/settings", label: "Settings", short: "Settings", icon: Settings },
] as const;

function useOpenCount() {
  const { data = [] } = useFeedback();
  const archived = useApp((s) => s.archived);
  const addressed = useApp((s) => s.addressed);
  return data.filter((f) => !archived.includes(f.id) && !addressed.includes(f.id)).length;
}

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-16 w-2/3" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

function AppShell() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const name = useApp((s) => s.profileName);
  const email = useApp((s) => s.email);
  const openCount = useOpenCount();

  const logout = async () => {
    if (!isDemoMode()) await supabase.auth.signOut();
    store.set({ demo: false });
    navigate({ to: "/" });
  };

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-sidebar/95 px-4 backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <ProjectSwitcher variant="topbar" />
        </div>
        <SearchTrigger variant="icon" />
        <ThemeToggle variant="header" />
        <Link to="/settings" aria-label="Your settings" className="rounded-full focus-visible:outline-none focus-visible:focus-ring">
          <Avatar name={name} brand />
        </Link>
      </header>

      {/* Sidebar: full on desktop, icon rail on tablet */}
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col border-r border-border bg-sidebar md:flex lg:w-60">
        <Link to="/dashboard" className="hidden h-14 items-center px-5 lg:flex" aria-label="FeedBackFlow home">
          <Logo size={26} />
        </Link>
        <div className="flex flex-col items-center gap-2 px-3 pt-4 lg:hidden">
          <ProjectSwitcher variant="rail" />
          <SearchTrigger variant="icon" />
        </div>
        <div className="hidden flex-col gap-2 px-3 lg:flex">
          <ProjectSwitcher variant="sidebar" />
          <SearchTrigger variant="sidebar" />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5 p-3">
          {NAV.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "group flex h-9 items-center justify-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:focus-ring lg:justify-start",
                  active
                    ? "bg-card text-foreground shadow-[0_1px_2px_oklch(0.2_0.02_20/0.06),0_0_0_1px_var(--color-border)]"
                    : "text-ink-3 hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-ink-subtle")} aria-hidden="true" />
                <span className="sr-only lg:not-sr-only lg:flex-1">{item.label}</span>
                {item.to === "/inbox" && openCount > 0 && (
                  <span className="tabular hidden rounded-md bg-primary-soft px-1.5 text-[11px] font-semibold leading-[18px] text-primary-ink lg:inline">
                    {openCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border p-3">
          <div className="hidden lg:block">
            <ThemeToggle variant="row" />
          </div>
          <div className="lg:hidden">
            <ThemeToggle variant="rail" />
          </div>
          <div className="mt-1 flex items-center justify-center gap-2.5 p-2 lg:justify-start">
            <Avatar name={name} brand />
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="truncate text-[13px] font-medium leading-[18px]">{email}</p>
              <p className="text-caption text-muted-foreground">{isDemoMode() ? "Demo workspace" : "Free trial · 12 days left"}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:focus-ring lg:block"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-5 md:px-7 md:pb-12 md:pt-8 lg:px-10 lg:pt-10">
          {/* App pages show live, time-relative data: render them in the browser only. */}
          {hydrated ? <Outlet /> : <PageSkeleton />}
          {hydrated && <CommandMenu />}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:focus-ring",
                active ? "text-primary-ink" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.short}
              {item.to === "/inbox" && openCount > 0 && (
                <span className="absolute right-[calc(50%-18px)] top-2.5 size-2 rounded-full bg-primary" aria-label={`${openCount} open`} />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
