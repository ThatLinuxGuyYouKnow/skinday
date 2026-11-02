## Inspiration

Shade-match tools stop at skin *tone* — but tone barely changes day to day. Skin *state* does. Redness flares before an interview, oil spikes on a travel day, dryness and texture show up in winter. Yet no fashion recommender reacts to any of that.

We looked at Round 1 winners — Aloud (honest voice-first guardrails), ShadeSpan/CASTING (quantified ΔE contrast scores), KeepMe/ConfidFit (face-lock + "visual preview only" trust labels) — and saw the gap: nobody used transient concerns like redness, oil, or dryness to change *what you should wear*. SkinDay closes that gap: dress for the skin you're in today.

## What it does

SkinDay turns one selfie into a head-to-toe look, re-computed for today's skin.

1. **Scan:** Upload one selfie. Lighting and face-size gates check it, with explicit "one photo, this session only" consent.
2. **Read:** Live YouCam Skin Analysis (7 concerns: acne, redness, oiliness, moisture, texture, radiance, dark circles) + Skin Tone Analysis (skin/lip/eye hexes) renders a skin-state card — e.g. skin `#b0896c` warm, redness 94.3, oil 73.
3. **Pick an occasion:** Interview / Date Night / Diwali Dinner / Travel.
4. **Agent decides, refusal-first:** a deterministic rule engine refuses what fights today's skin and shows its math — e.g. refuse true-red matte lip when redness is high, refuse white silk when oil is high, refuse heavy matte + clingy wool when dry/textured. Every pick carries its ΔE contrast number (forest top ΔE 46.8 "won't wash you out" vs. nude camel ΔE 11.1 "refused, washes out").
5. **Prove:** single-call full-face Makeup VTO + garment Clothes VTO rendered on you, with a draggable before/after slider.
6. **Checkout:** look bundle (2 garments + foundation + lip) with Add/Added toggles, return-risk note, and honest "visual preview only, not a fit guarantee" labels throughout.

Tagline: your skin changes daily. Your cart should too. Consumer value: fewer regret buys and returns. Retail value: higher bundle AOV instead of a single shade sale.

## How we built it

- **Stack:** Next.js 14 App Router + TypeScript on Vercel. No DB, no auth — cart is localStorage. All YouCam keys stay server-side; the browser never sees them.
- **YouCam APIs (all server-side, async task + poll):**
  - Skin Analysis SD7 (`/s2s/v2.0/task/skin-analysis`, 12u) — `raw_score` drives logic, `ui_score` drives display, plus signed mask overlays and a skin-age bonus signal.
  - Skin Tone Analysis (20u) — drives palette; Fitzpatrick computed offline, never paid for.
  - Makeup VTO (4u) — one call, full-face `effects[]` (foundation + lip + blush).
  - Clothes VTO v4 (2u) — full look costs 38u, measured live on our key 2026-11-01.
- **Agentic workflow, rules first:** `skin_profile (raw scores + hexes) → rule engine (lib/advisor.ts) → palette rank (ΔE*ab contrast + lightness) → build makeup effects[] + garment pick → parallel VTO calls → proof screen + cart`. No LLM guessing — every claim traces to a score. Copy is cosmetic-only by linter discipline ("reads stronger," "flatters" — never treats/heals).
- **Reliability pattern:** fixture mode + frozen golden run in `lib/fixtures/demo.json` (CASTING pattern). A budget circuit-breaker checks credit before any live run and falls back to the labeled precomputed demo — judges never hit a dead app. Our key hit 0u mid-build, so this wasn't theoretical.
- **Design:** warm beauty-editorial, mobile-first single page (cream `#faf6f1`, berry `#8e2f45`, serif wordmark), 720px column, skin-bar card, why-math card, compare slider, bundle card, honesty footnote.

## Challenges we ran into

- **Two photos from one upload.** Skin/Tone reject faces under 60% frame width (`error_src_face_too_small`); Clothes rejects face-crops (`error_no_shoulder`). Fix: send a cropped face to Skin/Tone/Makeup and the full frame to Clothes.
- **Docs were wrong in places.** Base path flips between `/v2.0` and `/s2s/v2.0`, lip_color silently requires `style`, sheer requires `transparencyIntensity`, and the pre-signed PUT is fatal if skipped — calling File API alone then the task returns 500/404. We learned to validate each stage separately.
- **Unit exhaustion mid-hackathon.** The feature-cost endpoint doesn't list these SKUs, and our key hit 0u. We measured real costs manually, then made fixture mode mandatory and added the credit guard.
- **Latency honesty.** Cloth VTO takes ~16–28s. Instead of faking instant results, we built staggered tile reveals with honest loading copy.
- **Overclaim pressure.** It's tempting to promise "perfect match" or cover blemishes medically. We held the line: every refusal shows reason + score, every render is labeled preview-only.

## Accomplishments that we're proud of

- A working 60-second loop: selfie → scored skin card → occasion-aware refusals with numbers → your-face makeup + outfit renders → bundle cart.
- Real numbers, not vibes: 7 measured concern scores, real tone hexes, real ΔE 46.8 vs 11.1 palette contrast on screen — no recommendation without its number.
- Refusal-first UX that says *no* with reasons (4 refuses / 5 prefers in the golden run) instead of another generic "complete the look" carousel.
- An app that cannot die on stage: credit guard + labeled precomputed fallback means a dead key or bad photo still demos cleanly.
- Full server-side key isolation, session-only photo framing, and stock-portrait disclosure done right.

## What we learned

- Tone is static; state is daily — and state changes fashion, not just foundation. That's a product insight, not just a model feature.
- `raw_score` vs `ui_score` are different instruments: one for rules, one for humans. Mixing them corrupts both.
- Trust is a feature: face-size gates, uncertainty copy ("lighting was dim, redness may read high"), and preview-only labels earned more judge interest than any extra shade.
- Deterministic rules beat LLM vibes for advice — use models for rendering, math for reasons.
- Meter everything: when the API won't tell you the price, measure it yourself and design the fallback first.

## What's next for SkinDay

- **Post-hackathon, in order:** face-lock toggle + look A vs B comparison, routine tracking over time (is redness a today thing or a trend?), Shopify App Proxy with metering for real retail checkout, and multi-garment / hair / accessory try-on.
- **Retail expansion:** shade-audit panel for sellers (same garment across measured tones with ΔL*/ΔE scores, ShadeSpan-style ROI: shoots saved, returns avoided).
- **Trust hardening:** expanded claim linter in CI, lighting-quality confidence on every score, and occasion chat ("interview, but outdoors?") via tool-called agent loop.
- **Vision:** SkinDay becomes the daily layer between skin truth and closet — today's face decides today's fit, and the cart follows.
