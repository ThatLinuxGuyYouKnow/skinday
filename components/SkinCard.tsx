const LABELS: Record<string, string> = {
  acne: "Blemishes",
  redness: "Redness",
  oiliness: "Oil / shine",
  moisture: "Dryness",
  texture: "Texture",
  radiance: "Dullness",
  dark_circle_v2: "Under-eye shadow",
};

function level(v: number, k: string) {
  // moisture is inverted: low score = dry = concern
  const concern = k === "moisture" ? 100 - v : v;
  if (concern >= 70) return { fill: "#8e2f45", tag: "high" };
  if (concern >= 45) return { fill: "#c2703d", tag: "moderate" };
  return { fill: "#1f4d3a", tag: "calm" };
}

export function SkinCard({ skin }: { skin: { raw: Record<string, number>; skinHex?: string; undertone?: string } }) {
  const entries = Object.entries(skin.raw).sort((a, b) => {
    const ca = a[0] === "moisture" ? 100 - a[1] : a[1];
    const cb = b[0] === "moisture" ? 100 - b[1] : b[1];
    return cb - ca;
  });
  const top = entries[0];
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: skin.skinHex || "#ccc", border: "2px solid #fff", boxShadow: "0 0 0 1px var(--line)" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Today's skin-state</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {skin.skinHex} · {skin.undertone} undertone
            {top ? ` · strongest signal: ${LABELS[top[0]] ?? top[0]} ${Math.round(top[0] === "moisture" ? 100 - top[1] : top[1])}` : null}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {entries.map(([k, v]) => {
          const { fill, tag } = level(v, k);
          const shown = k === "moisture" ? Math.round(100 - v) : Math.round(v);
          return (
            <div key={k} className="bar-row" title={`${tag} concern`}>
              <span className="k">{LABELS[k] ?? k.replace(/_/g, " ")}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${shown}%`, background: fill }} />
              </div>
              <span className="v">{shown}</span>
            </div>
          );
        })}
      </div>
      <div className="caption">Higher = stronger signal today, not a diagnosis. Dryness is shown inverted (100 − moisture).</div>
    </div>
  );
}
