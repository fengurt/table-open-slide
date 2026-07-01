# docx-master Docker deployment

Run the **Content studio** (HTML Lab + docx-master GUI + REST API) and optional **stdio MCP** in containers with LibreOffice preview and multi-provider LLM fallback.

## Quick start

```bash
cp docs/env.example .env
# Edit .env — set DOCX_MASTER_AI_API_KEY (and optional fallback keys)

docker compose -f docker-compose.docx-studio.yml up -d --build
open http://localhost:3333/docx
```

Health: `curl http://localhost:3333/api/docx/llm-status`

## Services

| Service | Port | Role |
| --- | --- | --- |
| `docx-studio` | 3333 | Vite preview + `/api/docx/*` REST (format, build, brands, out files) |
| `docx-mcp` (profile `mcp`) | stdio | MCP tools for Cursor / Claude Desktop |

Generated `.docx` / PDF / PNG previews persist in Docker volume `docx_out` (mounted at `/repo/out`).

## LLM — multiple API sources

Providers are tried **in order** until one succeeds (`skills/tableai-docx-master/lib/llm-router.mjs`).

### Option A — env prefixes (recommended)

```env
# Primary
DOCX_MASTER_AI_API_KEY=sk-...
DOCX_MASTER_AI_BASE_URL=https://api.openai.com/v1
DOCX_MASTER_AI_MODEL=gpt-4o-mini

# Fallback (e.g. DeepSeek, n1n.ai gateway)
DOCX_MASTER_AI_FALLBACK_API_KEY=...
DOCX_MASTER_AI_FALLBACK_BASE_URL=https://api.deepseek.com/v1
DOCX_MASTER_AI_FALLBACK_MODEL=deepseek-chat

# Tertiary (legacy)
OPENAI_API_KEY=...
```

### Option B — explicit JSON chain

```env
DOCX_MASTER_AI_PROVIDERS='[{"id":"openai","apiKey":"sk-...","baseUrl":"https://api.openai.com/v1","model":"gpt-4o-mini"},{"id":"deepseek","apiKey":"...","baseUrl":"https://api.deepseek.com/v1","model":"deepseek-chat"}]'
```

When set, this **replaces** the prefix chain.

## MCP (stdio) in Docker

Build MCP bundle on host first (optional — image includes `dist/`):

```bash
pnpm docx:mcp:build
```

Attach MCP from container:

```bash
docker compose -f docker-compose.docx-studio.yml --profile mcp run --rm -i docx-mcp
```

Cursor `mcp.json` example (host path → container stdio):

```json
{
  "mcpServers": {
    "docx-master": {
      "command": "docker",
      "args": [
        "compose",
        "-f",
        "/absolute/path/to/table-slides01/docker-compose.docx-studio.yml",
        "--profile",
        "mcp",
        "run",
        "--rm",
        "-i",
        "docx-mcp"
      ],
      "env": {
        "DOCX_MASTER_AI_API_KEY": "sk-..."
      }
    }
  }
}
```

See also `docs/mcp-docx-master.example.json` for local (non-Docker) stdio.

## REST API (agents without MCP)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/docx/llm-status` | Provider chain status |
| GET | `/api/docx/brands` | List `modules/*/design.md` |
| POST | `/api/docx/format` | Raw paste → Markdown (LLM) |
| POST | `/api/docx/build` | Markdown → .docx + validate + preview |

Example:

```bash
curl -s http://localhost:3333/api/docx/llm-status | jq .
curl -s -X POST http://localhost:3333/api/docx/build \
  -H 'content-type: application/json' \
  -d '{"markdown":"# Hello\n\nBody.","brand":"modules/atelier-brand/design.md"}'
```

## Requirements in image

- **LibreOffice** (`soffice`) — PDF preview
- **poppler** (`pdftoppm`) — page PNGs
- **xmllint** — OOXML validation

## Local dev (no Docker)

```bash
pnpm dev:html-lab          # :3333
pnpm docx:mcp:build        # stdio MCP
pnpm docx:from-md:build -- --md path.md --brand modules/atelier-brand/design.md
```
