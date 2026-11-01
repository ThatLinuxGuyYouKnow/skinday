export function SkinCard({ skin }: { skin: { raw: Record<string, number>; skinHex?: string; undertone?: string } }) {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: skin.skinHex || "#ccc" }} />
        <div>
          <div style={{ fontWeight: 700 }}>Today's skin-state</div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            {skin.skinHex} · {skin.undertone}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
        {Object.entries(skin.raw).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <span style={{ width: 130, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
            <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4 }}>
              <div style={{ width: `${v}%`, height: 8, borderRadius: 4, background: "#111" }} />
            </div>
            <span style={{ width: 32, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
