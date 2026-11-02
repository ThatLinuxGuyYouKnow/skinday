"use client";
import { useState } from "react";

export function LookCompare({ before, after, label = "Drag to compare" }: { before?: string | null; after?: string | null; label?: string }) {
  const [pos, setPos] = useState(50);
  if (!before && !after) return <div className="card" style={{ borderStyle: "dashed", color: "var(--muted)", fontSize: 14 }}>Your try-on renders will appear here.</div>;
  const shown = after ?? before!;
  return (
    <div>
      <div className="compare">
        {before && after ? (
          <>
            <img src={before} alt="original" />
            <img src={after} alt="result" className="top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
            <div className="divider" style={{ left: `${pos}%` }} />
            <div className="grip" style={{ left: `${pos}%` }}>↔</div>
          </>
        ) : (
          <img src={shown} alt="result" />
        )}
        {before && after ? (
          <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label={label} />
        ) : null}
      </div>
      <div className="caption">{before && after ? `${label} · ` : ""}visual preview only, not a fit guarantee.</div>
    </div>
  );
}
