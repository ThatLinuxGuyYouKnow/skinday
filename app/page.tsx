"use client";
import { useEffect, useState } from "react";
import { SkinCard } from "@/components/SkinCard";
import { WhyCard } from "@/components/WhyCard";
import { LookCompare } from "@/components/LookCompare";
import { HonestLabel } from "@/components/HonestLabel";
import { BudgetMeter } from "@/components/BudgetMeter";
import { GuideTour, type TourStep } from "@/components/GuideTour";

const OCCASIONS = ["Interview", "Date Night", "Diwali Dinner", "Travel"];

type SkinData = {
  skin: { raw: Record<string, number>; skinHex?: string; undertone?: string };
  advice: { refuses: { item: string; reason: string }[]; prefers: string[] };
  palette?: { name: string; hex: string; deltaE_vs_skin: number; note: string }[];
  mode?: string;
};

const PRODUCTS = [
  { name: "Forest tailored blazer", meta: "Garment · deep forest", hex: "#1f4d3a", refused: false },
  { name: "Camel satin blouse", meta: "Garment · visible, but not recommended", hex: "#c19a6b", refused: true, flag: "LOW CONTRAST" },
  { name: "Muted berry lip tint", meta: "Makeup · soft satin finish", hex: "#8e2f45", refused: false },
  { name: "Weightless skin veil", meta: "Makeup · natural finish", hex: "#e8d5c3", refused: false },
];

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-skin",
    eyebrow: "Step 1 · Your skin today",
    title: "Start with your strongest signal",
    body: "The top number is what drives everything below. Bars are ranked — calm at the bottom matters as much as red at the top.",
  },
  {
    targetId: "tour-why",
    eyebrow: "Step 2 · Why this look",
    title: "We say no with reasons",
    body: "Skipped items show exactly which score ruled them out. Every pick carries its ΔE contrast number, not just vibes.",
  },
  {
    targetId: "tour-makeup",
    eyebrow: "Step 3 · Makeup preview",
    title: "Drag the slider",
    body: "Before on the left, your render on the right. This is a cosmetic preview of finish and tone — not coverage promises.",
  },
  {
    targetId: "tour-outfit",
    eyebrow: "Step 4 · Outfit preview",
    title: "See it in context",
    body: "The garment render for your occasion edit. Visual preview only — drape and fit will vary in real life.",
  },
  {
    targetId: "tour-bundle",
    eyebrow: "Step 5 · Your edit",
    title: "Add only what feels right",
    body: "Four pieces, one checkout. Flagged items stay visible so you can see what we refused — and why.",
  },
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
  const [data, setData] = useState<SkinData | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("skinday-cart") || "[]"));
    } catch {
      /* fresh cart */
    }
  }, []);

  // Auto-open the guided tour the first time results arrive.
  useEffect(() => {
    if (!data?.skin) return;
    try {
      if (localStorage.getItem("skinday-tour-seen") === "1") return;
    } catch {
      /* private mode — still show once */
    }
    setTourIndex(0);
    setShowTour(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function closeTour() {
    setShowTour(false);
    try {
      localStorage.setItem("skinday-tour-seen", "1");
    } catch {
      /* private mode */
    }
  }

  async function run() {
    setLoading(true);
    setCheckoutMsg(null);
    try {
      // NOTE: MVP sends the same image to all endpoints. Dual-capture (face crop vs full frame) is TODO per SCOPE §6.
      const r = await fetch("/api/skin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64: img, occasion }),
      });
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
  const count = cart.length;

  return (
    <main className="shell">
      <header>
        <div>
          <div className="brand">
            SkinDay<i>.</i>
          </div>
          <div className="tag">Dress for the skin you&apos;re in today.</div>
        </div>
        <BudgetMeter />
      </header>

      <div className="eyebrow">Your daily styling ritual</div>
      <h1>
        Good skin day.
        <br />
        <em>Great outfit day.</em>
      </h1>
      <p className="intro">
        Your skin has a mood. Your look should know it. Get a considered makeup and outfit edit based
        on how your skin looks today.
      </p>

      <section className="card">
        <div className="stephead">
          <span className="num">1</span>
          <strong>Let&apos;s see today&apos;s skin</strong>
          <span className="hint">One selfie · this session only</span>
        </div>
        <div className="upload">
          {img ? (
            <img className="avatar" src={img} alt="Your uploaded selfie preview" />
          ) : (
            <div className="avatar-empty" aria-hidden>
              ◍
            </div>
          )}
          <div className="uploadcopy">
            <strong>Your photo, your private moment.</strong>
            <span>Front-facing, natural light works best.</span>
          </div>
          <label htmlFor="file">Upload selfie</label>
          <input
            id="file"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setImg(await fileToDataUrl(f));
            }}
          />
        </div>
      </section>

      <section className="card">
        <div className="stephead">
          <span className="num">2</span>
          <strong>Where are you headed?</strong>
          <span className="hint">Choose one</span>
        </div>
        <div className="chips" role="group" aria-label="Occasion">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              className={occasion === o ? "chip active" : "chip"}
              aria-pressed={occasion === o}
              onClick={() => setOccasion(o)}
            >
              {o}
            </button>
          ))}
        </div>
      </section>

      <button className="primary" onClick={run} disabled={loading}>
        {loading ? "Reading skin…" : "Get today's look  →"}
      </button>
      <div className="tiny">Your photo stays in this session. No account needed.</div>
      {img && !data && !loading ? (
        <div className="nudge" role="status">
          <span aria-hidden>✓</span>
          <div>
            <b>Photo ready — two steps left.</b>
            Pick your occasion above, then hit “Get today&apos;s look”. Your skin read, reasoning, previews, and bundle will appear below in order.
          </div>
        </div>
      ) : null}
      {loading ? (
        <div className="nudge" role="status" aria-live="polite">
          <span aria-hidden>◍</span>
          <div>
            <b>Reading your skin…</b>
            Scoring 7 signals, then building your occasion edit. Previews appear below — take the 5-step tour when it pops up.
          </div>
        </div>
      ) : null}

      {data?.skin && data?.advice ? (
        <>
          <div className="mode">
            {isFixture ? <span className="badge">Precomputed demo</span> : null}
            <span>
              {data.mode}  ·  {occasion} edit  ·  0 units used
            </span>
            <button
              className="tour-replay"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                setTourIndex(0);
                setShowTour(true);
              }}
            >
              How to read this?
            </button>
          </div>

          <div id="tour-skin">
            <SkinCard skin={data.skin} />
          </div>
          <div id="tour-why">
            <WhyCard advice={data.advice} palette={data.palette} />
          </div>

          <section className="card" id="tour-makeup">
            <div className="eyebrow">03 / Makeup preview</div>
            <h2>Soft focus, not full cover.</h2>
            <p className="subtle" style={{ marginTop: 0 }}>
              A fresh, balanced finish that lets your skin look like skin.
            </p>
            <LookCompare
              before={img}
              after={isFixture ? "/fixtures/makeup_golden.jpg" : null}
            />
          </section>

          {isFixture ? (
            <section className="card" id="tour-outfit">
              <div className="eyebrow">04 / Outfit preview</div>
              <h2>The forest-green moment.</h2>
              <p className="subtle" style={{ marginTop: 0 }}>
                Polished, confident, and quietly memorable.
              </p>
              <div className="visual outfit">
                <img src="/fixtures/cloth_golden.jpg" alt="Forest-green outfit visual preview" />
                <span className="caption">{occasion.toUpperCase()} EDIT · VISUAL PREVIEW ONLY</span>
              </div>
              <p className="visual-note">Visual preview only, not a fit guarantee.</p>
            </section>
          ) : null}

          <section className="card" id="tour-bundle">
            <div className="eyebrow">05 / Your edit, ready to shop</div>
            <h2>Bring the whole look together.</h2>
            <p className="subtle" style={{ marginTop: 0 }}>
              A considered four-piece edit. Add only what feels right.
            </p>
            {PRODUCTS.map((p) => {
              const on = cart.includes(p.name);
              return (
                <div key={p.name} className="product">
                  <div className="prodswatch" style={{ background: p.hex }} aria-hidden />
                  <div>
                    <div className="prodname">
                      {p.name} {p.refused && p.flag ? <span className="refused">{p.flag}</span> : null}
                    </div>
                    <div className="prodmeta">{p.meta}</div>
                  </div>
                  <button className={on ? "add added" : "add"} onClick={() => toggleCart(p.name)}>
                    {on ? "✓ Added" : "＋ Add"}
                  </button>
                </div>
              );
            })}
            <div className="cartline">
              <b>
                {count} item{count === 1 ? "" : "s"} in your edit
              </b>
              {count ? (
                <button className="clear" onClick={clearCart}>
                  Clear selection
                </button>
              ) : null}
            </div>
            <button
              className="primary"
              style={{ marginBottom: 0 }}
              onClick={() =>
                setCheckoutMsg(
                  count
                    ? `Your ${count}-piece edit is ready for checkout in this demo.`
                    : "Add an item to your edit first.",
                )
              }
            >
              Continue with your edit  →
            </button>
            {checkoutMsg ? (
              <p className="subtle" role="status">
                {checkoutMsg}
              </p>
            ) : null}
          </section>

          <HonestLabel />
        </>
      ) : null}
      {showTour && data?.skin ? (
        <GuideTour
          steps={TOUR_STEPS}
          index={tourIndex}
          onNext={() => setTourIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1))}
          onBack={() => setTourIndex((i) => Math.max(i - 1, 0))}
          onDone={closeTour}
        />
      ) : null}
    </main>
  );
}
