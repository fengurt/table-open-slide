---
name: docx-master
description: >
  Generate natively editable Word (.docx) from content specs via docx-js, driven by a vendored
  brand design.md. Validates OOXML and previews via LibreOffice PDF + PNG rasterization.
  Use when user asks for Word doc, .docx, 生成docx, 导出 Word, deck deliverable, FA handoff document.
---

# docx-master

Generate **editable `.docx`** (OOXML via [docx-js](https://www.npmjs.com/package/docx)), styled from a vendored **`modules/<brand>/design.md`**.

## When to use

- Downloadable Word deliverable (FA memo, deck spec, workshop handout)
- Brand-locked typography (CJK + Latin), tables, bullets, running header/footer

## When NOT to use

- React open-slide decks → `slide-authoring`
- HTML guizang decks → `skills/tableai-guizang-ppt-skill/`
- Native `.pptx` → `ppt-master`

## Workflow (mandatory order)

1. **Read this skill + [reference.md](./reference.md)** before writing any docx code.
2. **Load brand** — `modules/<brand>/design.md` (see schema below).
3. **Author content** — either:
   - **Markdown** — `pnpm docx:from-md:build -- --md path/to/doc.md --brand modules/kind-brand/design.md`
   - **Spec module** — `examples/deck-spec.example.mjs`: export `meta` + `build(helpers, brand, contentWidthDxa)`.
4. **Generate** — `pnpm docx:generate -- --spec <spec.mjs> --brand <design.md> [--out out/]`
5. **Validate** — `pnpm docx:validate -- --docx out/<name>.docx` (xmllint on OOXML parts).
6. **Preview** — `pnpm docx:preview -- --docx out/<name>.docx` → PDF + `page-NN.png` for visual QA (CJK, tables, H2 rule).

Or one shot:

- Spec: `pnpm docx:build -- --spec ... --brand ...`
- Markdown: `pnpm docx:from-md:build -- --md ... --brand modules/kind-brand/design.md`

Markdown parser: [`lib/md-to-docx.mjs`](./lib/md-to-docx.mjs) — `#`/`##`/`###`, `**bold**`, `| tables |`, `-` bullets, `1.` numbered, `---`, italic footer lines.

## Brand design.md schema

Path: `modules/<brand>/design.md` (vendored; examples: `modules/atelier-brand/`, `modules/kind-brand/`).

```markdown
---
name: MyBrand
pageSize: a4   # or letter
---

## Colors
ink: #1A1A1A
gold: #B89B6E
muted: #666666
paper: #FFFFFF
tableHeaderFill: #F4F1EA

## Fonts
latin: Calibri
eastAsia: Microsoft YaHei

## Typography
bodySize: 22    # half-points
h1: 32
h2: 27
h3: 24

## Chrome
header: Running header text
footer: 机密

## Heading rule
enabled: true
size: 6

## Voice
Tone guidance for the agent (not rendered into the doc unless you choose).
```

Parsed by [`lib/brand.mjs`](./lib/brand.mjs).

## docx-js rules (non-negotiable)

- **No `\n`** — one `Paragraph` per line.
- **Bullets** — `numbering` config, never type `•`.
- **Tables** — dual widths via `TBL()`; column sum = table width; `WidthType.DXA`.
- **Shading** — `ShadingType.CLEAR`, not `SOLID`.
- **Headings** — style IDs `Heading1`/`Heading2`/`Heading3` + `outlineLevel` for TOC.
- **H2 gold rule** — paragraph `border.bottom`, not empty table row.
- **CJK** — `font: { name, eastAsia }` on every run.
- **Page numbers** — `PageNumber.CURRENT` field in footer, not literal text.

## Helpers

Import from [`lib/docx-helpers.mjs`](./lib/docx-helpers.mjs):

| Helper | Purpose |
| --- | --- |
| `P()` | Body paragraph |
| `B()` / `B2()` | Bullet levels |
| `H1/H2/H3` | Headings |
| `TBL()` | Width-safe table |
| `runs()` | `[{b:'bold'}, 'plain']` DSL |
| `deckPage()` | Repeated slide-spec page |
| `buildDocument()` | Section + styles + numbering |

## Checklist

- [ ] Read reference.md anti-patterns
- [ ] Brand design.md loaded
- [ ] Spec uses helpers (no raw width mistakes)
- [ ] `pnpm docx:validate` passes
- [ ] Preview PNGs checked for CJK + tables + H2 rule
- [ ] TOC: remind user to Update Field in Word if page nums empty

## Paths

| Path | Role |
| --- | --- |
| `skills/tableai-docx-master/` | Skill + libs + scripts |
| `modules/<brand>/design.md` | Brand tokens (share repo here) |
| `out/` | Generated `.docx`, `.pdf`, preview PNGs (gitignored) |

## MCP server (agents)

Stdio MCP at `apps/docx-mcp-server/` — optimized for agents with structured JSON (`agent.nextSteps`, `agent.artifacts`).

| Tool | When |
| --- | --- |
| `docx_llm_status` | Check LLM env before format |
| `list_brands` | Pick `modules/*/design.md` |
| **`docx_format_and_build`** | **Paste → LLM → .docx (primary agent path)** |
| `docx_format_text` | Raw → Markdown only |
| `docx_build` | Markdown already ready |
| `docx_preview` / `docx_validate` | QA |

Resource: `docx://workflow` — full agent playbook.

```bash
pnpm docx:mcp:build
```

Env: `DOCX_MASTER_AI_API_KEY` or `OPENAI_API_KEY` (see `docs/env.example`).

## GUI (html-lab `/docx`)

```bash
pnpm dev:html-lab   # http://localhost:3333/docx
```

**Workflow:** Paste → Format with LLM → edit Markdown + live MD preview → Build .docx → Word PNG preview.

Brand pack switchable anytime; LLM uses brand voice from `design.md`.
