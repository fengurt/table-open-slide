---
name: kind-deck-authoring
description: Edits slides/kind-bp01/kind_presentation for kind-viewer (1280×720 HTML+MD, EN/zh). Use when fixing deck layout, bilingual MD, slide CSS, P1–P19 pages, layout misalignment, stacked columns, or kind-viewer slideRender. Do not use for apps/demo open-slide React slides.
---

# kind-bp01 deck authoring (kind-viewer)

## Scope

| In scope | Out of scope |
|----------|--------------|
| `slides/kind-bp01/kind_presentation/` | `apps/demo/slides/` (use `slide-authoring`) |
| `{id}.html` styles + `{id}.md` en/zh | `packages/core` viewer for open-slide |
| `apps/kind-viewer/server/slideRender.ts` layout host rules | Bulk rewrite MD without `pnpm fix:kind-md` |

## MD contract (critical)

Each `{id}.md`:

```markdown
<!-- en -->
<div class="slide-container">
  ...inner only — exactly one container per locale...
</div>

<!-- zh -->
<div class="slide-container">
  ...inner only...
</div>
```

**Never** nest a second `<div class="slide-container">` inside the first. **Never** leave `</div>` count wrong after edits.

## HTML contract

- `{id}.html` = **styles** (viewer extracts `<style>` only when rendering MD).
- `.slide-container`: `height: 720px; min-height: 720px; display: flex`.
  - **Row slides** (P1–P3, most left/right): no `flex-direction: column` on `.slide-container`.
  - **Stack slides** (P4 pillars, P15 team grid): `flex-direction: column` on `.slide-container` only.

## Viewer runtime (do not break)

`slideRender.ts` chooses host layout from **`.slide-container { }` block only**:

| Slide type | `.slide-container` CSS | Host injects |
|------------|------------------------|--------------|
| Row (title, mission, problem, moat, …) | `display:flex` (no column) | `flex-direction: row !important` |
| Stack (solution_pillars, founding_team, …) | `flex-direction: column` | `flex-direction: column !important` |

**Wrong detector (fixed):** grepping whole stylesheet for `flex-direction: column` — P1 `.right-panel { flex-direction: column }` must **not** flip the slide to stack.

- `deck-base.css` — shared zh typography + 1280×720 lock.
- `layouts/*.json` — only applied with `layoutApply=1` (layout editor). **Presenter uses native CSS.**

## Layout diagnosis (when user says "fucked up" / misaligned)

Run in order:

1. **`pnpm fix:kind-md`** — duplicate `slide-container` in zh/en?
2. **Rendered host rule** — must be `flex-direction:row` for P1/P2:
   ```bash
   cd apps/kind-viewer && pnpm build && node -e "
   import { resolveSlideHtml } from './dist-server/slideRender.js';
   const h = await resolveSlideHtml('../../slides/kind-bp01/kind_presentation','title_slide.html','en');
   console.log(h.match(/slide-md-host \\.slide-container\\{[^}]+\\}/)?.[0]);
   "
   ```
3. **No `kind-layout-active`** on presenter unless user saved bad layout JSON.
4. **Spot-check EN + 中文** at http://localhost:5190/

## Scripts (always use for bulk ops)

| Command | Purpose |
|---------|---------|
| `pnpm fix:kind-md` | Strip duplicate `slide-container` wrappers in all `.md` |
| `node apps/kind-viewer/scripts/polish-kind-deck.mjs` | HTML spacing only — **does not touch MD** |
| `pnpm bootstrap:kind-layouts` | Optional layout JSON from measurement |

## Locked slides (P1–P3)

`title_slide`, `mission_vision`, `problem_gap` — edit deliberately; after any bulk tool run **`pnpm fix:kind-md`** and visual check both locales.

## Before finishing

- [ ] `pnpm fix:kind-md` if any `.md` changed
- [ ] P1–P3: left | right columns side-by-side, not stacked
- [ ] EN and 中文 for every touched slide
- [ ] No new `layouts/*.json` unless user asked (bad JSON broke P1 historically)

## Incident log

See [reference.md](reference.md).
