---
name: skill-authoring-benchmark
description: Writes and reviews Cursor Agent Skills for this monorepo. Use when creating skills, improving SKILL.md files, or asking for skill best practices. References op7418/guizang-ppt-skill patterns, Cursor create-skill guide, and lessons from kind-viewer deck work.
---

# Skill authoring benchmark (this monorepo)

Meta-skill for **writing skills agents actually follow**. Combines [Cursor create-skill](https://cursor.com/docs/context/skills), [op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) workflow discipline, and Vercel-style modular rules.

## When to use

- User asks to create, improve, or audit a skill
- After a production incident (layout broke, batch script broke MD) — capture the guardrail here first
- Before adding a skill under `.cursor/skills/` or `apps/*/skills/`

## Skill anatomy (required)

```
skill-name/
├── SKILL.md           # Required: frontmatter + workflow + checklist
├── reference.md       # Optional: deep rules, incident log, API tables
├── examples.md        # Optional: good/bad pairs
└── scripts/           # Optional: deterministic fixes (prefer over generated code)
```

| Field | Rule |
|-------|------|
| `name` | kebab-case, ≤64 chars |
| `description` | Third person; **WHAT + WHEN**; trigger terms users actually say |
| Body | ≤500 lines in SKILL.md; link out for depth |

## Patterns we adopt (from references)

### From [op7418/guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill)

| Pattern | Apply here |
|---------|------------|
| **Clarify before build** | Tables of questions with "why ask" column for fragile workflows |
| **When / when not** | Explicit in-scope vs out-of-scope |
| **Numbered workflow** | Step 1 clarify → Step 2 contract → Step 3 implement → Step 4 verify |
| **Checklists** | Copy-paste progress lists agents can tick |
| **Good/bad examples** | Concrete snippets, not abstract advice |
| **Scripts for fragile ops** | Batch MD/HTML transforms → `scripts/*.mjs`, never ad-hoc sed in chat |
| **Progressive disclosure** | SKILL.md = path; `reference.md` = incident log + tables |

### From Cursor create-skill

| Pattern | Apply here |
|---------|------------|
| Concise | No textbook explanations |
| One terminology | e.g. always `slide-container`, not "wrapper" / "root" mixed |
| Low / medium / high freedom | Fragile layout = low freedom (scripts + exact HTML shape) |
| No time-sensitive "before August 2025" | Use "deprecated" sections instead |

### From Vercel modular skills (`.agents/skills/vercel-react-best-practices`)

| Pattern | Apply here |
|---------|------------|
| Single-purpose rules | One skill per domain (deck vs open-slide React vs framework) |
| `metadata.json` optional | For large rule packs only |
| Cross-link, don't duplicate | `kind-deck-authoring` vs `slide-authoring` — link, don't merge |

## Monorepo skill map

| Skill path | Domain | Do not use for |
|----------|--------|----------------|
| `apps/kind-viewer/skills/kind-deck-authoring` | `slides/kind-bp01/kind_presentation` HTML+MD, 1280×720 | `apps/demo/slides` React |
| `packages/core/skills/slide-authoring` | open-slide `slides/<id>/index.tsx` 1920×1080 | kind-bp01 HTML deck |
| `skills/tableai-docx-master` | Brand-driven `.docx` via docx-js | React / HTML / pptx |
| `skills/tableai-guizang-ppt-skill` | Single-file HTML horizontal deck | `.docx` / `.pptx` |
| `apps/demo/.claude/skills/create-slide` | New open-slide deck workflow | kind-viewer |

**Rule:** If the user says "slides" in this repo, check path — `kind_presentation/` → kind-deck-authoring; `apps/demo/slides/` → slide-authoring.

## Authoring workflow

### Step 1 — Scope (mandatory for layout/content skills)

Answer before writing:

1. **Exact paths** touched
2. **Failure modes** seen in past sessions (double wrapper, wrong flex axis, batch overwrite)
3. **Scripts** that must/ must not run
4. **Locked assets** (e.g. P1–P3) that bulk tools skip

### Step 2 — Draft SKILL.md

Include:

- Scope table (in / out)
- File contract (exact HTML/MD shape if applicable)
- Workflow steps
- Verification commands (`pnpm fix:kind-md`, `pnpm dev:kind-viewer`, spot-check EN+zh)
- Anti-patterns table (from real incidents)

### Step 3 — Add guardrail scripts when fragile

If a mistake happened twice (duplicate `slide-container`, wrong `flex-direction` grep), add:

- `scripts/fix-*.mjs` with idempotent repair
- `package.json` script alias
- Skill says: run script after bulk edit, never hand-wave

### Step 4 — Wire discovery

- Add one line to root `AGENTS.md` and `CLAUDE.md`
- Description must include user phrases: "layout broken", "bilingual MD", "kind-viewer", "P1 P2"

## Description template

```yaml
---
name: domain-action
description: [What it does in one sentence]. Use when [user phrases], [file paths], or [failure symptoms].
---
```

Example (kind deck):

```yaml
description: Edits kind-bp01 bilingual HTML deck and kind-viewer layout rules. Use for kind_presentation MD/HTML, layout misalignment, EN/zh slides, or kind-viewer slideRender issues.
```

## Verification checklist (before merging a new skill)

- [ ] Description is third person with triggers
- [ ] SKILL.md < 500 lines or split to reference.md
- [ ] At least one good/bad example for the top failure mode
- [ ] Scripts documented if batch operations exist
- [ ] No overlap with another skill without explicit "use X not Y"
- [ ] AGENTS.md points to the skill for that path

## Incident-driven rules (template for reference.md)

When something broke in production, append:

```markdown
### YYYY-MM-DD — [short title]
- **Symptom:** …
- **Cause:** …
- **Fix:** …
- **Guardrail:** script / code change / checklist item
```

## Related skills in this repo

- [kind-deck-authoring](../../../apps/kind-viewer/skills/kind-deck-authoring/SKILL.md) — KiND BP deck
- [create-skill](https://github.com/op7418) — external reference: [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill)
