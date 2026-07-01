---
name: docx-master
description: >
  Generate natively editable Word (.docx) via docx-js from content specs + vendored brand design.md.
  Validates OOXML and previews via LibreOffice PDF + PNG. Triggers: Word doc, .docx, 生成docx, FA handoff.
---

# docx-master

**Read the canonical skill before any Word generation:**

`skills/tableai-docx-master/SKILL.md`

## Quick start

```bash
pnpm docx:build -- --spec skills/tableai-docx-master/examples/deck-spec.example.mjs --brand modules/atelier-brand/design.md
```

Brand repo: `modules/<brand>/design.md` (share your design.md there).

## Brand registry

| Say this | Brand module | Source |
| --- | --- | --- |
| "use Table AI" / Table AI 排版 | `modules/tableai-brand/design.md` | `…/000tableai_designaha001/TABLEAI/TableAI_DESIGN.md` — 寰宇深蓝 `#0A1626` + 日晷暗金 `#A88B52`, Manrope/Noto Sans SC (see `.cursor/rules/table-ai-format.mdc`) |
| "use KiND" | `modules/kind-brand/design.md` | KiND·善渡科技 |
| "use Microsoft" | `modules/microsoft-brand/design.md` | Fluent / Segoe UI |

## Do not use for

- React open-slide decks
- guizang HTML decks
- Native `.pptx` (use `ppt-master`)

Wrapper: `skills/tableai-docx-master/SKILL.md`
