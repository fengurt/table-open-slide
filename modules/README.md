# Vendored agent modules

Third-party slide / PPT / doc agent assets live here.

| Module | Upstream | Role |
| --- | --- | --- |
| `tableai-ppt-master/` | [fengurt/tableai-ppt-master](https://github.com/fengurt/tableai-ppt-master) | Native **PPTX** (DrawingML, SVG pipeline) |
| `<your-brand>/` | (shared brand repo) | **`design.md`** for **docx-master** |
| `atelier-brand/` | (example, committed) | Sample `design.md` for Atelier tokens |

## Sync

```bash
pnpm sync:ppt-master   # sparse clone PPTX agent
```

Brand: clone or copy your repo to `modules/<brand>/design.md`.

Cursor: `.cursor/skills/ppt-master/` · `.cursor/skills/docx-master/`.

Docx pipeline: `pnpm docx:build -- --spec ... --brand modules/<brand>/design.md`
