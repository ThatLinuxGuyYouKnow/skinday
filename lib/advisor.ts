// Deterministic rules first, LLM for words only.
// Input: raw_scores (precise) + hexes. Output: filters + refusal list + palette rank.
export type SkinProfile = {
  raw: Record<string, number>; // e.g. { redness: 68, oiliness: 72, ... } 0-100, higher = stronger concern
  skinHex?: string;
  undertone?: "warm" | "cool" | "neutral";
};

export type Advice = {
  refuses: { item: string; reason: string }[];
  prefers: string[];
  makeup: { finish: string; coverage: string; lipNote: string };
};

export function advise(profile: SkinProfile, occasion: string): Advice {
  const r = profile.raw;
  const refuses: Advice["refuses"] = [];
  const prefers: string[] = [];

  if ((r.redness ?? 0) >= 60) {
    refuses.push(
      { item: "Red / orange tops near face", reason: `redness ${r.redness} reads stronger next to warm hues` },
      { item: "True-red matte lip", reason: "high-chroma red competes with redness; sheer berry flatters instead" },
    );
    prefers.push("Forest / navy top (high contrast, calms redness)", "Sheer berry lip + tinted moisturizer over full-coverage matte");
  }
  if ((r.oiliness ?? 0) >= 60) {
    refuses.push({ item: "White silk / clingy shine fabrics", reason: `oil ${r.oiliness}: shine + sweat show fastest on pale silk` });
    prefers.push("Matte finish, patterned weave");
  }
  if ((r.moisture ?? 100) <= 40 || (r.texture ?? 0) >= 60) {
    refuses.push({ item: "Heavy matte foundation + clingy wool", reason: "dryness/texture catches on matte + coarse knits" });
    prefers.push("Dewy finish, satin drape");
  }
  if ((r.dark_circle_v2 ?? r.darkCircle ?? 0) >= 60) {
    prefers.push("Higher neckline draws gaze away from under-eye shadow");
  }
  void occasion;

  const finish = (r.oiliness ?? 0) >= 60 ? "matte" : (r.moisture ?? 100) <= 40 ? "dewy" : "natural";
  const coverage = (r.redness ?? 0) >= 60 || (r.acne ?? 0) >= 60 ? "sheer-to-medium (tinted moisturizer)" : "light";
  return { refuses, prefers, makeup: { finish, coverage, lipNote: (r.redness ?? 0) >= 60 ? "sheer berry over true-red" : "warm nude" } };
}

// --- Palette math (offline, no units): hex -> CIELAB, contrast steps, CIEDE2000-lite ---
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function rgbToLab([r, g, b]: [number, number, number]): [number, number, number] {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  let [R, G, B] = [f(r), f(g), f(b)];
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const g2 = (t: number) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);
  [x, y, z] = [g2(x), g2(y), g2(z)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// Simple ΔE*ab (use as ΔL* contrast proxy + distance). Full CIEDE2000 is post-MVP.
export function deltaE(hex1: string, hex2: string) {
  const [l1, a1, b1] = rgbToLab(hexToRgb(hex1));
  const [l2, a2, b2] = rgbToLab(hexToRgb(hex2));
  return Math.hypot(l2 - l1, a2 - a1, b2 - b1);
}

export function lightness(hex: string) {
  return rgbToLab(hexToRgb(hex))[0];
}
