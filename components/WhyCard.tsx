type Refuse = { item: string; reason: string };

function shortItem(item: string) {
  // "True-red matte lip" stays; long rule strings get trimmed to the head noun.
  if (item.length <= 26) return item;
  const cut = item.split(/—|:/)[0].trim();
  return cut.length <= 30 ? cut : `${item.slice(0, 28).trim()}…`;
}

function shortReason(reason: string) {
  const m = reason.match(/^([^.:;]+[.:;])?\s*(.{0,64})/);
  const s = (m?.[0] ?? reason).trim();
  return s.length > 72 ? `${s.slice(0, 70).trim()}…` : s;
}

export function WhyCard({
  advice,
  palette,
}: {
  advice: { refuses: Refuse[]; prefers: string[] };
  palette?: { name: string; hex: string; deltaE_vs_skin: number; note: string }[];
}) {
  const skipped = advice.refuses.slice(0, 4);
  const picked = advice.prefers.slice(0, 4);
  return (
    <section className="card">
      <div className="eyebrow">02 / The thinking behind your look</div>
      <h2>Chosen with intention.</h2>
      <p className="subtle" style={{ marginTop: 0 }}>
        Every recommendation has a reason. If the contrast doesn&apos;t work, we say so.
      </p>
      <div className="split">
        <div>
          <div className="listtitle">Skipped for today</div>
          {skipped.map((r) => (
            <div key={r.item} className="reason">
              <span className="x">✕</span>
              <div>
                <b>{shortItem(r.item)}</b>
                <small>{shortReason(r.reason)}</small>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="listtitle">Picked instead</div>
          {picked.map((p) => (
            <div key={p} className="reason">
              <span className="yes">✓</span>
              <div>
                <b>{shortItem(p)}</b>
                <small>{shortReason(p.split("—")[1]?.trim() ? p.split("—").slice(1).join("—").trim() : p)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
      {palette?.length ? (
        <div className="palette">
          <div className="eyebrow">Palette contrast · ΔE*ab</div>
          {palette.map((p) => {
            const refused = /reject/i.test(p.name) || p.deltaE_vs_skin < 20;
            const label = p.name.replace(/^Rejected:\s*/i, "").split("#")[0].trim() || p.name;
            return (
              <div key={p.name} className="palette-row">
                <span className="cloth" style={{ background: p.hex }} />
                <b>{label}</b>
                <span className={refused ? "delta bad" : "delta"}>
                  ΔE {p.deltaE_vs_skin} · {refused ? "REFUSED" : "PICK"}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
