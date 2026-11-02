"use client";
import { useEffect, useState } from "react";
import { SkinCard } from "@/components/SkinCard";
import { WhyCard } from "@/components/WhyCard";
import { LookCompare } from "@/components/LookCompare";
import { HonestLabel } from "@/components/HonestLabel";
import { BudgetMeter } from "@/components/BudgetMeter";

const OCCASIONS = ["Interview", "Date Night", "Diwali Dinner", "Travel"];
const GARMENTS = [
  { name: "Forest top #1F4D3A (ΔE 46.8 — won't wash you out)", url: "https://plugins-media.makeupar.com/strapi/assets/clothes_reference_full_body_01_5a000d999f.png" },
  { name: "Nude camel #C19A6B (ΔE 11.1 — refused, washes out)", url: "" },
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

  function addToCart(name: string) {
    const next = [...cart, name];
    setCart(next);
    localStorage.setItem("skinday-cart", JSON.stringify(next));
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24, display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>SkinDay</h1>
        <BudgetMeter />
      </header>
      <p style={{ margin: 0, opacity: 0.7 }}>Dress for the skin you're in today. One selfie → skin-state → look bundle.</p>

      <section style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 600 }}>1. Scan (one photo, this session only)</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setImg(await fileToDataUrl(f));
          }}
        />
        {img ? <img src={img} alt="upload" style={{ width: "100%", borderRadius: 12, border: "1px solid #eee" }} /> : null}
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 600 }}>2. Occasion</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(o)}
              style={{ padding: "8px 14px", borderRadius: 20, border: occasion === o ? "2px solid #111" : "1px solid #ccc", background: "#fff" }}
            >
              {o}
            </button>
          ))}
        </div>
      </section>

      <button onClick={run} disabled={loading} style={{ padding: 14, borderRadius: 12, background: "#111", color: "#fff", fontSize: 16 }}>
        {loading ? "Reading skin… (cloth VTO takes ~20s live)" : "3. Get today's look"}
      </button>

      {data?.skin && data?.advice ? (
        <>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Mode: {data.mode} · occasion: {occasion}</div>
          <SkinCard skin={data.skin} />
          <WhyCard advice={data.advice} palette={data.palette} />
          <LookCompare before={img} after={String(data.mode).startsWith("fixture") ? "/fixtures/makeup_golden.jpg" : null} />
          {String(data.mode).startsWith("fixture") ? (
            <figure style={{ margin: 0, display: "grid", gap: 4 }}>
              <img src="/fixtures/cloth_golden.jpg" alt="Outfit VTO (precomputed golden run)" style={{ width: "100%", borderRadius: 12, border: "1px solid #e5e5e5" }} />
              <figcaption style={{ fontSize: 12, opacity: 0.6 }}>Outfit VTO — precomputed golden run · visual preview only, not a fit guarantee.</figcaption>
            </figure>
          ) : null}
          <section style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 600 }}>4. Bundle checkout (localStorage cart)</div>
            {GARMENTS.map((g) => (
              <div key={g.name} style={{ display: "flex", justifyContent: "space-between", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
                <span>{g.name}</span>
                <button onClick={() => addToCart(g.name)}>Add ({cart.includes(g.name) ? "✓" : "+"})</button>
              </div>
            ))}
            <div style={{ fontSize: 14 }}>Cart: {cart.length ? cart.join(", ") : "empty"}</div>
          </section>
          <HonestLabel />
        </>
      ) : null}
    </main>
  );
}
