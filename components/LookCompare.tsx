"use client";
import { useState } from "react";

export function LookCompare({
  before,
  after,
  label = "Drag to compare",
}: {
  before?: string | null;
  after?: string | null;
  label?: string;
}) {
  const [pos, setPos] = useState(55);
  if (!before && !after) {
    return (
      <div className="card" style={{ borderStyle: "dashed", color: "var(--muted)", fontSize: 14 }}>
        Your try-on renders will appear here.
      </div>
    );
  }
  const shown = after ?? before!;
  if (!before || !after) {
    return (
      <div>
        <div className="visual">
          <img src={shown} alt="Makeup visual preview" />
          <span className="caption">VISUAL PREVIEW · NOT A FIT GUARANTEE</span>
        </div>
        <p className="visual-note">Visual preview only, not a fit guarantee.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="visual compare">
        <img src={before} alt="Before makeup" />
        <div className="after" style={{ width: `${pos}%` }}>
          <img src={after} alt="After makeup visual preview" />
        </div>
        <div className="grip" style={{ left: `${pos}%` }}>
          ↔
        </div>
        <span className="caption">BEFORE&nbsp; / &nbsp;AFTER · VISUAL PREVIEW</span>
      </div>
      <input
        className="range"
        type="range"
        min={5}
        max={95}
        value={pos}
        aria-label={label}
        onChange={(e) => setPos(Number(e.target.value))}
      />
      <p className="visual-note">
        {label}. Visual preview only, not a fit guarantee.
      </p>
    </div>
  );
}
