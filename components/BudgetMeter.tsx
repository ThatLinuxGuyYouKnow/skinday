"use client";
import { useEffect, useState } from "react";

export function BudgetMeter() {
  const [s, setS] = useState<unknown>(null);
  useEffect(() => {
    fetch("/api/budget").then((r) => r.json()).then(setS).catch(() => setS({ mode: "error" }));
  }, []);
  const mode = (s as { mode?: string } | null)?.mode;
  return <div className="pill">Units: {mode === "fixture" ? "demo mode · 0 spent" : mode ?? "…"}</div>;
}
