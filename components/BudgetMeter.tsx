"use client";
import { useEffect, useState } from "react";

export function BudgetMeter() {
  const [s, setS] = useState<{ mode?: string } | null>(null);
  useEffect(() => {
    fetch("/api/budget")
      .then((r) => r.json())
      .then(setS)
      .catch(() => setS({ mode: "error" }));
  }, []);
  const mode = s?.mode;
  return <div className="meter">✦ {mode === "fixture" ? "DEMO MODE  ·  0 SPENT" : mode ? mode.toUpperCase() : "…"}</div>;
}
