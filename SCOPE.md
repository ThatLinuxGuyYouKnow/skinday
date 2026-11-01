# SkinDay — Dress for the skin you're in today — Scope

## 1. One-liner
One selfie -> live skin-state read -> head-to-toe look (makeup + outfit) re-computed for today's skin -> one-click bundle checkout.

Tagline: your skin changes daily. Your cart should too.

Track: **Skin AI + eCommerce VTO** (fusion — exactly what Round 2 brief asks for).

## 2. Why this wins (Round 1 lessons)
Round 1 winners (238 entries):
- **Aloud (1st):** voice-first for blind shoppers, deep Skin Analysis + guardrails. Lesson: accessibility + honesty wins.
- **ShadeSpan / CASTING:** B2B shade audit — same garment on 6-8 measured tones, ΔL*/ΔE2000 contrast score. Lesson: quantified ROI (84 shoots saved), not vibes.
- **KeepMe / ConfidFit:** trust layer — face-lock, drift repair, "visual preview only" label, live on Shopify with metering. Lesson: production-ready beats demo.

SkinDay steals all three: state-aware (not just tone-aware), scored with math, shoppable with honest labels.

Differentiator: tone is static. **State is daily.** No winner used transient concerns (redness/acne/oil/dryness today) to change *fashion* recommendations. That's the gap.

## 3. Core user journey (60-sec demo)
1. **Scan:** upload selfie (or dual-capture, see §6). Lighting/face-size gate. Consent: "one photo, this session only."
2. **Read:** Skin Analysis SD 7 concerns + Tone hexes -> skin card: Redness 68, Oil 72, Texture 61, Radiance 54 + `skin #b28e73`, undertone warm.
3. **Pick occasion:** Interview / Date Night / Diwali Dinner / Travel. This is the agentic trigger.
4. **Agent decides (refusal-first):**
   - IF redness high -> refuse red/orange tops near face, true-red matte lip. Propose: forest/navy top, sheer berry lip, tinted moisturizer over full-coverage matte.
   - IF oil high -> matte, avoid white silk (sweat shows), prefer patterns.
   - IF dry/textured -> dewy finish, satin drape, avoid clingy wool + heavy matte.
   Each refusal shows reason + score, like Fit Check.
5. **Prove:** Makeup VTO + Apparel VTO rendered ON YOU. Before/after slider, face-lock badge.
6. **Checkout:** Look bundle (foundation + lip + top) Add-to-cart, return-risk note, "visual preview only, not fit guarantee."

## 4. MVP scope (ships by Nov 2 — cut hard)
IN:
- Next.js App Router + TS, Vercel. No DB, no auth. localStorage cart.
- 1 selfie upload, 1 occasion picker, 2 pre-curated garments + 2 foundation shades + 2 lips.
- 3 live YouCam calls: Skin Analysis (SD 7) -> Tone Analysis -> Makeup VTO (1 call, multi-effect) + Clothes VTO (1-2 calls). Total ~16-18 units / full look.
- Fixture mode + precomputed demo run (CASTING pattern). Circuit-breaker checks `GET /s2s/v1.0/client/credit` before live run, falls back to labeled precomputed result. Judges never hit a dead app.
- Guardrail copy: cosmetic language only, no treatment claims, uncertainty stated ("lighting was dim, redness may read high").

OUT (post-hackathon): Shopify App Proxy, user accounts, routine tracking over time, video, hair, accessories, multi-model panel.

## 5. YouCam APIs (all server-side, key never in browser)
Base: `https://yce-api-01.makeupar.com`. Bearer `Authorization: Bearer KEY`.

| # | API | Endpoint | Role | Cost* |
|---|-----|----------|------|-------|
| 1 | File | `POST /s2s/v2.0/file/skin-analysis`, `/file/cloth-v4`, `/file` (makeup) -> PUT bytes to presigned URL | must PUT bytes — calling File API alone then task = 500/404 | 0 |
| 2 | Skin Analysis | `POST /s2s/v2.0/task/skin-analysis` `dst_actions: ["acne","redness","oiliness","moisture","texture","radiance","dark_circle_v2"]`, `format:"json"` -> `data.results.output[]` = `{type, raw_score, ui_score, mask_urls[1 signed 2h], url:null}` + bonus `{type:'all',score}`, `{type:'skin_age',score}`. Use `raw_score` for logic, `ui_score` for display. Never mix SD+HD. Face >60% width AND short side ≥480px or free `error_src_face_too_small` / `error_below_min_image_size`. | **12** |
| 3 | Tone | `POST /s2s/v2.0/task/skin-tone-analysis` `{src_file_id}` -> `results: {color:{skin_color,lip_color,eye_color,eyebrow_color,eye_color_name}, face_quality:{...}}` | drives palette. Do NOT pay for Fitzpatrick — compute ITA offline. | **20** |
| 4 | Makeup VTO | `POST /s2s/v2.0/task/makeup-vto` `{version:"1.0", src_file_url|id, effects:[foundation, lip_color{style}, blush{pattern}]}` -> `results:{url}` | lip_color REQUIRES `style`; sheer REQUIRES `transparencyIntensity`; 400s are free. | **4** |
| 5 | Clothes VTO | `POST /s2s/v2.0/task/cloth-v4` `{src_file_id, ref_file_id, garment_category}` -> `results:{url}` | ~16s. 2 units only on `success`, rejects free. | **2** |

*Costs MEASURED live on this key 2026-11-01 (feature-cost endpoint does not list these SKUs). Full look = 38u. Key balance is now 0 — fixture mode mandatory until top-up.

## 6. Hard engineering gotchas (docs are wrong in places)
- **Two photos from one upload:** Tone/Skin reject if face <60% width (`error_src_face_too_small`); Clothes rejects face-crop with `error_no_shoulder`. Send cropped face to Skin/Tone/Makeup, full frame to Clothes.
- **Async only:** every task returns `task_id`, poll `GET .../{task_id}` to `success/error`. Don't short-poll; results retained 24h.
- **Pre-signed PUT is fatal if skipped.** Validate each stage separately.
- **Makeup schema:** parse `results.url` vs `results[]` defensively; `base path /v2.0 vs /s2s/v2.0` inconsistent in docs — use `/s2s/v2.0`.
- **Latency UX:** staggered tile reveal matching real 16-28s cloth latency (honest loading, per CASTING).

## 7. Agentic workflow (no thin wrapper)
Deterministic rules first, LLM for words only:
```
skin_profile (raw_scores + hexes) -> rule engine (tone/finish/pattern filter + refuse list)
  -> palette rank (CIEDE2000 distance, lightness step, hue geometry)
  -> build makeup effects[] + garment pick
  -> parallel VTO calls -> proof screen + cart
```
Vercel AI SDK loop optional for occasion chat ("interview, but outdoor?"). Tools: `getSkinProfile`, `rankPalette`, `renderMakeup`, `renderOutfit`. Every spoken/shown claim traces to a score. Claim linter in CI blocks medical language (Aloud pattern).

## 8. File structure
```
app/page.tsx (scan -> occasion -> proof -> cart)
app/api/skin/route.ts (file+task+poll skin)
app/api/tone/route.ts
app/api/makeup/route.ts
app/api/cloth/route.ts
app/api/budget/route.ts (credit + feature-cost guard)
lib/youcam.ts (auth, upload, poll, fixtures)
lib/advisor.ts (state->filter rules, palette math)
lib/fixtures/*.json (frozen golden run)
components/SkinCard, LookCompare (slider), WhyCard, HonestLabel, BudgetMeter
```

## 9. Design bar
One seamless look, mobile-first. Bare scan -> look A vs look B with why-math ("4.2 ΔL* contrast, won't wash you out like #12"). Draggable original-vs-result. Face-lock toggle (KeepMe lesson). No raw JSON on screen.

## 10. Submission checklist (Devpost)
- [ ] Public GitHub repo + README with setup, unit costs, what is measured vs estimated
- [ ] Text description: consumer + retail value (fewer returns, higher AOV bundle)
- [ ] Screenshots
- [ ] 1-3 min YouTube demo: end-to-end on device, name YouCam APIs used
- [ ] No third-party marks/music without permission
- [ ] Exit interview + blog consent if winner

## 11. Risks
- Photo rejects (pose/lighting) -> guided capture + fixture fallback, cost nothing on error.
- Unit exhaustion -> budget guard + precomputed labeled demo.
- Overclaim (fit guarantee, medical advice) -> honest labels everywhere, refusal copy with reasons.
