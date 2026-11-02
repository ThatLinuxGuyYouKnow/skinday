"use client";
import { useEffect, useState } from "react";
import { SkinCard } from "@/components/SkinCard";
import { WhyCard } from "@/components/WhyCard";
import { LookCompare } from "@/components/LookCompare";
import { HonestLabel } from "@/components/HonestLabel";
import { BudgetMeter } from "@/components/BudgetMeter";

const OCCASIONS = ["Interview", "Date Night", "Diwali Dinner", "Travel"];
const GARMENTS = [
  { name: "Forest top", detail: "#1F4D3A · ΔE 46.8 — won't wash you out", refused: false },
  { name: "Nude camel", detail: "#C19A6B · ΔE 11.1 — refused, washes out", refused: true },
];
const BUNDLE = [
  { name: "Sheer berry lip", detail: "transparent glow over true-red matte" },
  { name: "Tinted moisturizer", detail: "sheer-to-medium, dewy where dry" },
];

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function Page() {
  const [img, setImg] = useState<string | null>(null);
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ skin?: { raw: Record<string, number>; skinHex?: string; undertone?: string }; advice?: { refuses: { item: string; reason: string }[]; prefers: string[] }; palette?: { name: string; hex: string; deltaE_vs_skin: number; note: string }[]; mode?: string } | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("skinday-cart") || "[]"));
    } catch {
      /* fresh cart */
    }
  }, []);

  async function run() {
    setLoading(true);
    try {
      // NOTE: MVP sends the same image to all endpoints. Dual-capture (face crop vs full frame) is TODO per SCOPE §6.
      const r = await fetch("/api/skin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageBase64: img, occasion }) });
      setData(await r.json());
    } finally {
      setLoading(false);
    }
  }

  function toggleCart(name: string) {
    const next = cart.includes(name) ? cart.filter((c) => c !== name) : [...cart, name];
    setCart(next);
    try {
      localStorage.setItem("skinday-cart", JSON.stringify(next));
    } catch {
      /* private mode */
    }
  }

  function clearCart() {
    setCart([]);
    try {
      localStorage.removeItem("skinday-cart");
    } catch {
      /* private mode */
    }
  }

  const isFixture = !!data?.mode?.startsWith("fixture");

  return (
    <main className="page">
      <header className="brand">
        <div>
          <h1 className="serif">SkinDay<span className="dot">.</span></h1>
          <p className="tagline">Dress for the skin you're in today. One selfie → skin-state → makeup + outfit bundle.</p>
        </div>
        <BudgetMeter />
      </header>

      <section className="card">
        <label className="step-label"><span className="n">1</span>Scan — one photo, this session only</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setImg(await fileToDataUrl(f));
          }}
        />
        {img ? <img src={img} alt="upload" className="preview-img" style={{ marginTop: 10 }} /> : null}
      </section>

      <section className="card">
        <label className="step-label"><span className="n">2</span>Occasion — the look adapts</label>
        <div className="chip-row" role="group" aria-label="Occasion">
          {OCCASIONS.map((o) => (
            <button key={o} onClick={() => setOccasion(o)} className="chip" aria-pressed={occasion === o}>
              {o}
            </button>
          ))}
        </div>
      </section>

      <button className="cta" onClick={run} disabled={loading}>
        {loading ? "Reading skin… (cloth VTO takes ~20s live)" : "Get today's look"}
      </button>

      {data?.skin && data?.advice ? (
        <>
          <div className="mode-line">
            {isFixture ? <span className="mode-badge">Precomputed demo</span> : null}
            <span>{data.mode} · {occasion}</span>
          </div>
          <SkinCard skin={data.skin} />
          <WhyCard advice={data.advice} palette={data.palette} />
          <div>
            <div className="step-label" style={{ marginBottom: 8 }}>Makeup, on you</div>
            <LookCompare before={img} after={isFixture ? "/fixtures/makeup_golden.jpg" : null} />
          </div>
          {isFixture ? (
            <div>
              <div className="step-label" style={{ marginBottom: 8 }}>Outfit, on you</div>
              <img src="/fixtures/cloth_golden.jpg" alt="Outfit VTO (precomputed golden run)" className="preview-img" />
              <div className="caption">Outfit VTO — precomputed golden run · visual preview only, not a fit guarantee.</div>
            </div>
          ) : null}
          <section className="card">
            <div className="step-label"><span className="n">3</span>Bundle checkout</div>
            <div style={{ display: "grid", gap: 8 }}>
              {[...GARMENTS, ...BUNDLE].map((g) => {
                const inCart = cart.includes(g.name);
                const refused = (g as { refused?: boolean }).refused;
                return (
                  <div key={g.name} className={refused ? "cart-row refused" : "cart-row"}>
                    <span>
                      <span className="nm">{g.name}</span>
                      <br />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{g.detail}{refused ? " · skipped for today" : ""}</span>
                    </span>
                    <button className={inCart ? "add-btn in-cart" : "add-btn"} onClick={() => toggleCart(g.name)}>
                      {inCart ? "✓ Added" : "Add +"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="cart-line" style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Cart ({cart.length}): {cart.length ? cart.join(" · ") : "empty"}</span>
              {cart.length ? <button className="link-btn" onClick={clearCart}>Clear</button> : null}
            </div>
          </section>
          <HonestLabel />
        </>
      ) : null}
    </main>
  );
}
