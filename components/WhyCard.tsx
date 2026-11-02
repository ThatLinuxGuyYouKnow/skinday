export function WhyCard({ advice, palette }: { advice: { refuses: { item: string; reason: string }[]; prefers: string[] }; palette?: { name: string; hex: string; deltaE_vs_skin: number; note: string }[] }) {
  return (
    <div className="card">
      <div style={{ fontWeight: 700, fontSize: 16 }}>Why this look <span style={{ fontWeight: 400, color: "var(--muted)" }}>— with math</span></div>
      {advice.refuses.length ? <div className="why-group">Skipped for today</div> : null}
      {advice.refuses.map((r) => (
        <div key={r.item} className="why-row skip">
          <span aria-hidden>✕</span>
          <span><strong>{r.item}</strong> <span className="why">— {r.reason}</span></span>
        </div>
      ))}
      <div className="why-group">Picked instead</div>
      {advice.prefers.map((p) => (
        <div key={p} className="why-row pick">
          <span aria-hidden>✓</span>
          <span>{p}</span>
        </div>
      ))}
      {palette?.length ? (
        <>
          <div className="why-group">Palette contrast vs your skin</div>
          {palette.map((p) => (
            <div key={p.name} className="why-row" style={{ background: "#f7f3ec" }}>
              <span className="swatch" style={{ background: p.hex }} />
              <span style={{ flex: 1 }}><strong>{p.name}</strong> <span className="why">— {p.note}</span></span>
              <span className="de-chip">ΔE {p.deltaE_vs_skin}</span>
            </div>
          ))}
        </>
      ) : null}
    </div>
  );
}
