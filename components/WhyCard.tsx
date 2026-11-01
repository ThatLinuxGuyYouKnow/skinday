export function WhyCard({ advice, palette }: { advice: { refuses: { item: string; reason: string }[]; prefers: string[] }; palette?: { name: string; hex: string; deltaE_vs_skin: number; note: string }[] }) {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 700 }}>Why this look (with math)</div>
      <ul>
        {advice.refuses.map((r) => (
          <li key={r.item}>
            ✕ {r.item} — <span style={{ opacity: 0.7 }}>{r.reason}</span>
          </li>
        ))}
        {advice.prefers.map((p) => (
          <li key={p}>✓ {p}</li>
        ))}
      </ul>
      {palette ? (
        <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
          {palette.map((p) => (
            <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              <span style={{ width: 18, height: 18, borderRadius: 4, background: p.hex, border: "1px solid #ddd" }} />
              <span>
                {p.name} — ΔE {p.deltaE_vs_skin}: {p.note}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
