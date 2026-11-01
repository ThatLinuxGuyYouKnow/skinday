"use client";
import { useState } from "react";

export function LookCompare({ before, after, label = "Drag to compare" }: { before?: string | null; after?: string | null; label?: string }) {
  const [pos, setPos] = useState(50);
  if (!before && !after) return <div style={{ padding: 24, border: "1px dashed #ccc", borderRadius: 12 }}>VTO result appears here (fixture mode: no live image yet).</div>;
  return (
    <div>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, border: "1px solid #e5e5e5" }}>
        {before ? <img src={before} alt="original" style={{ display: "block", width: "100%" }} /> : <div style={{ padding: 60 }}>original</div>}
        {after ? (
          <img
            src={after}
            alt="result"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          />
        ) : null}
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} style={{ width: "100%" }} aria-label={label} />
      </div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label} · visual preview only, not a fit guarantee.</div>
    </div>
  );
}
