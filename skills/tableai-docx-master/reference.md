# docx-master reference

## Units (memorize)

| Measure | Unit | Example |
| --- | --- | --- |
| Page / margin / table width | **DXA** (twentieth of a point) | 1 inch = 1440 |
| A4 page | DXA | 11906 × 16838 |
| Letter page | DXA | 12240 × 15840 |
| Font size | **half-points** | `size: 22` → 11pt |
| Images | EMU | 914400 per inch |

## Anti-patterns

| Wrong | Right |
| --- | --- |
| Unicode `•` in text | `numbering` + `LevelFormat.BULLET` |
| Table width only on table | `columnWidths` **and** each cell `width`, sum must match |
| `WidthType.PERCENTAGE` | `WidthType.DXA` (Google Docs breaks %) |
| `ShadingType.SOLID` on cells | `ShadingType.CLEAR` (else black boxes) |
| Empty table row as divider | Paragraph `border.bottom` on H2 |
| `\n` inside one paragraph | New `Paragraph` per line |
| Default docx-js page size | Set A4 or Letter explicitly in section props |
| Skip visual preview | Always run `pnpm docx:preview` for CJK |

## Numbering refs

Use **separate** numbering references when a list must restart at 1:

```javascript
numbering: { reference: 'numAppendixA', level: 0 }
```

Define each ref in `buildNumbering({ bullets: 'bullets', numAppendixA: 'numAppendixA' })`.

## Incident log

### 2026-06-10 — Table width mismatch

- **Symptom:** Columns render narrow in LibreOffice, wide in Word.
- **Cause:** `columnWidths` sum ≠ table `width`.
- **Guardrail:** Always build tables via `TBL()` helper.

### 2026-06-10 — CJK fallback

- **Symptom:** Chinese renders in Times New Roman.
- **Cause:** Missing `eastAsia` on `TextRun.font`.
- **Guardrail:** Use `defaultDocumentFonts(brand)` everywhere.

## CLI

```bash
pnpm docx:from-md:build -- --md path/to/doc.md --brand modules/kind-brand/design.md
pnpm docx:generate -- --spec skills/tableai-docx-master/examples/deck-spec.example.mjs --brand modules/atelier-brand/design.md
pnpm docx:validate -- --docx out/<name>.docx
pnpm docx:preview -- --docx out/<name>.docx
pnpm docx:build -- --spec ... --brand ...
```

## Brand design.md schema

See [SKILL.md](./SKILL.md) § Brand design.md.
