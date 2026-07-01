# kind-deck-authoring — reference & incidents

## Layout types by slide id

| Page | id | Container flex | Notes |
|------|-----|----------------|-------|
| P1 | title_slide | row | 58% / 42% panels |
| P2 | mission_vision | row | 52% / 48% |
| P3 | problem_gap | row | 36% / 64% |
| P4 | solution_pillars | column | header + 3 pillars |
| P5–P11 | various | row or column | check `.slide-container` in html |
| P15 | founding_team | column | header + 2×2 grid |

## 2026-05 — Double `slide-container` in MD (P1–P19 zh)

- **Symptom:** P1/P2 columns stacked; zh layout collapsed.
- **Cause:** `polish-kind-deck.mjs` wrapped zh block that already had `slide-container`.
- **Fix:** `fix-md-slide-wrappers.mjs` + `pnpm fix:kind-md`.
- **Guardrail:** polish script no longer writes MD; always run `pnpm fix:kind-md` after batch MD touch.

## 2026-05 — Wrong flex axis (P1/P2 row → column)

- **Symptom:** Left and right panels vertical; titles misaligned.
- **Cause:** `slideRender` used `/flex-direction:\s*column/i` on **entire** stylesheet; matched `.right-panel { flex-direction: column }`.
- **Fix:** `slideContainerUsesColumnLayout()` — only `.slide-container { }` block.
- **Guardrail:** Never grep full CSS for column; see `slideRender.ts`.

## 2026-05 — Forced column on all embed slides (earlier)

- **Symptom:** All two-column decks broken after viewer "fix".
- **Cause:** `.slide-md-host .slide-container { flex-direction: column }` in `wrapInSlideShell`.
- **Fix:** Row vs stack detection + explicit `row !important` for row slides.

## op7418 patterns we mirror

From [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill):

- Clarify before bulk edit (style, audience, locked pages).
- Separate **reference** (layouts, themes) from **workflow** (steps).
- Scripts for repeatable transforms; SKILL stays short.
