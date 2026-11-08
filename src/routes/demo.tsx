import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/app/primitives";
import { store } from "@/lib/store";

/** /demo — one link for the portfolio: enters demo mode and opens the app. */
export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "Live demo · FeedBackFlow" }] }),
  component: Demo,
});

function Demo() {
  const navigate = useNavigate();
  useEffect(() => {
    store.set({ demo: true });
    navigate({ to: store.get().onboarded ? "/dashboard" : "/onboarding", replace: true });
  }, [navigate]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-panel">
      <Logo />
      <p className="text-muted-foreground">Opening the demo workspace…</p>
    </div>
  );
}
