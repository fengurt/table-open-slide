# open-slide — Framework Repo Guide

You are working on the **open-slide framework** — the runtime, CLI, and tooling that ship to npm.

(Slide-authoring guidance lives in the `slide-authoring` / `create-slide` skills under `apps/demo/.claude/skills/`. Use those only when editing files inside `apps/demo/slides/`.)

For **`slides/kind-bp01/kind_presentation/`** (kind-viewer deck), use **`apps/kind-viewer/skills/kind-deck-authoring/SKILL.md`**. After bulk MD edits run `pnpm fix:kind-md`.

To **author or improve agent skills**, use **`.cursor/skills/skill-authoring-benchmark/SKILL.md`** ([op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) patterns).

For **native `.pptx` generation** (DrawingML, SVG → PPTX), use **`.cursor/skills/ppt-master/SKILL.md`** → vendored [`modules/tableai-ppt-master/`](modules/tableai-ppt-master/) ([fengurt/tableai-ppt-master](https://github.com/fengurt/tableai-ppt-master)). Sync with `pnpm sync:ppt-master`.

For **editable Word (.docx)** from brand `design.md`, use **`.cursor/skills/docx-master/SKILL.md`** → [`skills/tableai-docx-master/`](skills/tableai-docx-master/). Pipeline: `pnpm docx:build` · GUI: `pnpm dev:html-lab` → `/docx` · MCP: `apps/docx-mcp-server/`.

## Slide agent routing

| Goal | Skill / path |
| --- | --- |
| React open-slide deck | `apps/demo/.claude/skills/slide-authoring` (demo slides only) |
| HTML guizang deck | `skills/tableai-guizang-ppt-skill/SKILL.md` |
| **Editable PowerPoint (.pptx)** | **`modules/tableai-ppt-master/skills/ppt-master/SKILL.md`** |
| **Editable Word (.docx)** | **`skills/tableai-docx-master/SKILL.md`** · MCP `docx-master` · GUI `html-lab` `/docx` |
| Kind markdown deck | `apps/kind-viewer/skills/kind-deck-authoring/SKILL.md` |

## Layout

pnpm + Turbo monorepo.

| Path | Package | Role |
| --- | --- | --- |
| `packages/core` | `@open-slide/core` | Runtime (viewer, present mode, inspector), Vite plugin, `open-slide` dev/build CLI. |
| `packages/cli` | `@open-slide/cli` | `npx @open-slide/cli init` scaffolder + project template. |
| `apps/demo` | private | Local consumer of `@open-slide/core` via `workspace:*`. Dogfood target — run `pnpm dev` here to exercise the framework. |
| `apps/web` | private | Marketing site (Next.js). |
| `apps/html-lab` | private | **Unified local hub** (`pnpm dev:html-lab` → :3333): HTML Lab, docx-master, deck journeys; indexes Content OS surfaces and agent MCP pipelines. |
| `modules/tableai-ppt-master` | vendored | Sparse clone of [tableai-ppt-master](https://github.com/fengurt/tableai-ppt-master) — PPTX agent (`pnpm sync:ppt-master`) |

Shared config: `biome.json`, `turbo.json`, `pnpm-workspace.yaml`, `tsconfig` per package.

## Workflow

```bash
pnpm dev          # turbo: runs demo against local core
pnpm build        # build all packages
pnpm typecheck    # tsc across the graph
pnpm check        # biome (format + lint + organize imports)
pnpm check:fix    # auto-fix what biome can
pnpm test         # vitest
```

Filter to one package: `pnpm core <script>` / `pnpm cli <script>`.

## Hard rules

- **Biome must pass before commit.** Run `pnpm check` (or `pnpm check:fix`). CI and the user's review both expect a clean tree.
- **If `packages/core` or `packages/cli` changes, add a changeset.** Run `pnpm changeset`, pick the right package(s) and bump (`patch` for fixes/polish, `minor` for new public API, `major` for breaking). Apps (`demo`, `web`) and root tooling do **not** need one.
- **Changeset descriptions: short and direct.** One line, present-tense, what changed from a user's perspective. Match the tone of `.changeset/*.md` already in the repo. No paragraphs, no rationale, no "this PR…".
  - Good: `Replace spinner with a hairline + sliding bar for slide and presenter loading states.`
  - Bad: `This change introduces a new loading indicator because the previous spinner felt heavy and we wanted something more subtle for presentation contexts…`
- Don't bump versions or edit `CHANGELOG.md` by hand — `changeset version` owns that.
- Don't add dependencies casually. The `core` runtime ships to users; every dep inflates install size.
- `packages/core/src/app/components/ui` is shadcn-generated and biome-ignored — leave it alone unless regenerating.

## Releasing (reference)

`pnpm release` builds `core` + `cli` and runs `changeset publish`. Triggered by the maintainer, not by agents.
