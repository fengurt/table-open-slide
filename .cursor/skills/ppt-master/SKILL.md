---
name: ppt-master
description: >
  AI-driven native PPTX generation from documents (PDF/DOCX/URL/Markdown). Multi-role pipeline
  Strategist → Image → Executor → export DrawingML .pptx. Triggers: create PPT, make presentation,
  生成PPT, 做PPT, PowerPoint, pptx, template fill, speaker notes audio.
---

# PPT Master

**You MUST read the canonical skill before any PPT work:**

`modules/tableai-ppt-master/skills/ppt-master/SKILL.md`

Also read `modules/tableai-ppt-master/AGENTS.md` for workflow routing (template-fill, resume-execute, live-preview, etc.).

If `modules/tableai-ppt-master/` is missing:

```bash
pnpm sync:ppt-master
pip install -r modules/tableai-ppt-master/requirements.txt
```

**Do not use this skill for:**

- open-slide React slides (`apps/demo/slides/`)
- guizang HTML horizontal decks (`skills/tableai-guizang-ppt-skill/`)

Wrapper pointer: `skills/tableai-ppt-master/SKILL.md`
