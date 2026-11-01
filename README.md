# SkinDay — Dress for the skin you're in today

One selfie → live skin-state → makeup + outfit re-computed for today → bundle checkout.

## Setup
1. `cp .env.example .env` and set `YOUCAM_API_KEY` (server-side only, never `NEXT_PUBLIC_`).
2. `npm install && npm run dev`
3. Without a key (or with `SKINDAY_FIXTURE_MODE=1`) the app serves the frozen golden run in `lib/fixtures/demo.json` — 0 units spent.

## What is measured vs estimated
- Measured live 2026-11-01 (key now at 0u — fixture mode mandatory until top-up): Skin Analysis SD7 raw_scores, tone hexes, VTO renders. Costs: skin 12u, tone 20u, makeup 4u, cloth 2u = 38u/full look.
- Computed offline: palette contrast (ΔE*ab), lightness steps, undertone proxy.
- Never claimed: fit guarantee, medical/treatment advice.
- Fixture faces are stock test portraits (labeled precomputed); user selfies replace them in live mode.

## Routes
- `POST /api/skin` — face crop → skin-state + advice (fixture fallback on any error so judges never hit a dead app).
- `POST /api/tone` — face crop → hexes.
- `POST /api/makeup` — face crop + effects[] → full-face VTO.
- `POST /api/cloth` — FULL frame + garmentUrl → outfit VTO (face-crops rejected with `error_no_shoulder`).
- `GET /api/budget` — credit + feature-cost circuit-breaker.

See `SCOPE.md` for unit budget (~17/look), dual-photo gotcha, and demo script.
