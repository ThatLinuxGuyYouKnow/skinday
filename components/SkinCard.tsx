const LABELS: Record<string, string> = {
  acne: "Blemishes",
  redness: "Redness",
  oiliness: "Oil / shine",
  moisture: "Dryness signal",
  texture: "Texture",
  radiance: "Dullness",
  dark_circle_v2: "Under-eye shadow",
};

// Display value: moisture and radiance are inverted (low score = stronger concern).
function shown(k: string, v: number) {
  if (k === "moisture" || k === "radiance") return Math.round(100 - v);
  return Math.round(v);
}

function fillClass(v: number) {
  if (v >= 70) return "fill high";
  if (v >= 45) return "fill";
  return "fill low";
}

export function SkinCard({ skin }: { skin: { raw: Record<string, number>; skinHex?: string; undertone?: string } }) {
  const entries = Object.entries(skin.raw)
    .map(([k, v]) => ({ k, v: shown(k, v) }))
    .sort((a, b) => b.v - a.v);
  const top = entries[0];
  return (
    <section className="card">
      <div className="eyebrow">01 / Your skin today</div>
      <h2>A warm, luminous starting point.</h2>
      <div className="state-top">
        <div className="swatch" style={{ background: skin.skinHex || "#b0896c" }} />
        <div className="tone">
          {(skin.skinHex || "#B0896C").toUpperCase()}
          <small>{skin.undertone ? `${skin.undertone} undertone` : "undertone"} · medium tan</small>
        </div>
        <div className="signal">
          <b>{top ? top.v.toFixed(1).replace(/\.0$/, "") : "—"}</b>
          strongest signal · {(top && LABELS[top.k]) ?? top?.k}
        </div>
      </div>
      <div className="metrics">
        {entries.map(({ k, v }) => (
          <div key={k}>
            <div className="metric-head">
              <b>{LABELS[k] ?? k.replace(/_/g, " ")}</b>
              <span>{v} / 100</span>
            </div>
            <div className="track">
              <div className={fillClass(v)} style={{ width: `${v}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="subtle">Signals are cosmetic preview indicators, not a medical assessment.</p>
    </section>
  );
}
