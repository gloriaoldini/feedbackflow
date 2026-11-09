import { useEffect, useState, type ReactNode } from "react";

/** Renders children only after hydration (charts, theme-dependent UI). */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return <>{ready ? children : fallback}</>;
}
