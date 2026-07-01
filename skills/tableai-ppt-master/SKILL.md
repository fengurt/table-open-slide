---
name: tableai-ppt-master
description: >
  Generate natively editable PPTX from PDF/DOCX/URL/Markdown via multi-role SVG pipeline.
  Use when the user asks to create PPT/PPTX/PowerPoint, 生成PPT, 做演示文稿, export to .pptx,
  or wants DrawingML shapes (not HTML slides or React open-slide decks).
---

# TableAI PPT Master (local module)

**Canonical workflow:** read and follow

`modules/tableai-ppt-master/skills/ppt-master/SKILL.md`

**Project entry:** `modules/tableai-ppt-master/AGENTS.md`

## Sync if missing

```bash
pnpm sync:ppt-master
```

## Route vs other slide agents in this repo

| Output | Agent / skill |
| --- | --- |
| React slides (`apps/demo/slides/`) | `slide-authoring` / `create-slide` (open-slide) |
| Single-file HTML deck (guizang) | `skills/tableai-guizang-ppt-skill/SKILL.md` |
| **Native `.pptx`** | **this skill → `modules/.../ppt-master/SKILL.md`** |
| Kind MD deck | `apps/kind-viewer/skills/kind-deck-authoring/SKILL.md` |

## Paths (after sync)

- Skill root: `modules/tableai-ppt-master/skills/ppt-master/`
- Python deps: `pip install -r modules/tableai-ppt-master/requirements.txt`
- Generated projects: `modules/tableai-ppt-master/projects/<name>/`

Upstream: [fengurt/tableai-ppt-master](https://github.com/fengurt/tableai-ppt-master)
