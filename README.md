<img width="1280" height="640" alt="open-slide github cover" src="https://github.com/user-attachments/assets/02f5e6d7-12a7-4a8e-88e7-ae8770a96584" />

# open-slide

**The slide framework built for agents.** Describe your deck in natural language — your coding agent writes the React. open-slide handles the canvas, scaling, navigation, hot reload, and present mode so the agent can focus on content.

Every slide renders into a fixed **1920 × 1080** canvas. Pages are arbitrary React components, not a constrained DSL.

```bash
npx @open-slide/cli init my-slide
```

## Why open-slide

Slides are visual code. Agents are great at writing code. open-slide is the missing runtime that turns "make slides about X" into a polished, presentable deck — without you ever leaving the chat.

## Highlights

### 🤖 Agent-native authoring

Works with any coding agent (Claude Code, Codex, Cursor, …). The scaffolder ships with built-in skills:

- **`/create-slide`** — drafts a deck end-to-end. Asks four scoping questions (topic & aesthetic, page count, text density, motion vs. static), picks an id, plans the structure, and writes the pages.
- **`/slide-authoring`** — the technical reference for the 1920 × 1080 canvas, type scale, palette, and layout rules. The agent reads this before writing.

From a one-line prompt to a polished deck, no boilerplate.

### 🎯 In-browser inspector

Click any element in the dev server and attach a comment — *"make this red"*, *"change to 'Open Slide Rocks'"*, *"shrink the headline"*. Comments are persisted as `@slide-comment` markers in source. Run `/apply-comments` and the agent applies every pending edit, then clears the markers.

The loop: present → click to comment → `/apply-comments` → repeat.

### 🖼️ Assets manager + svgl logo search

Manage images, videos, and fonts per deck through a built-in assets panel. Search and drop in any brand logo via the integrated [svgl](https://svgl.app/) catalogue — no more hunting for SVGs.

### 🎬 Professional present mode

Fullscreen playback with keyboard navigation, plus a **presenter mode** with current/next slide preview, speaker notes, and a timer. Built for the stage, not just the browser tab.

### 📦 Export to static HTML & PDF

One command exports your deck as a self-contained static HTML site or a print-ready PDF. Share without a server.

### 📁 Slide manager

Organise decks into folders with custom emoji and drag-and-drop to reorder. Useful once you've built more than three decks and need to find anything.

### 🚀 Deploy-friendly

Outputs a plain static build — one-click deploy to Vercel, Cloudflare Pages, Zeabur, Netlify, or any static host. No server, no runtime, no lock-in.

## Get started

```bash
npx @open-slide/cli init my-slide
cd my-slide
pnpm dev
```

The scaffolded workspace ships with agent skills preconfigured for Claude Code. From there you drive the deck through your agent — or edit `slides/<id>/index.tsx` directly. See [CLAUDE.md](CLAUDE.md) for the hard rules.

## Repo layout

This repo is a pnpm + Turbo monorepo.

| Path | Description |
| --- | --- |
| [packages/core](packages/core) | `@open-slide/core` — runtime (home page, slide viewer, present mode, inspector), Vite plugin, and the `open-slide` dev/build/preview CLI. |
| [packages/cli](packages/cli) | `@open-slide/cli` — `npx @open-slide/cli init` scaffolder. Generates a minimal workspace where Vite/React/tsconfig stay hidden inside core. |
| [packages/content](packages/content) | `@table/content` — Zod schemas, REST client helpers, and surface bindings (website, brief, financials, …). |
| [apps/demo](apps/demo) | Example workspace that consumes `@open-slide/core` via `workspace:*`. Used for local development of the framework. |
| [apps/cms](apps/cms) | Payload CMS v3 + Postgres — localized `content-blocks`, slide bindings, slide comments, media. |
| [apps/mcp-server](apps/mcp-server) | Stdio MCP server (`list_content`, `get_content`, `update_content`, `bind_slide`, …) over Payload REST. |
| [apps/web](apps/web) | Fumadocs marketing/docs site (port 3000 in `pnpm dev:up`). |
| [apps/html-lab](apps/html-lab) | **Unified local hub** at http://localhost:3333 — HTML Lab, docx-master, deck journeys; links to all runtimes, Content OS surfaces, and MCP pipelines. |
| [apps/website](apps/website), [apps/brief](apps/brief), … | Minimal Next.js surfaces consuming `@table/content` bindings (run per-app `dev` for ports). |

## Development

```bash
pnpm install
pnpm dev      # runs the demo against the local @open-slide/core
pnpm dev:html-lab   # unified hub :3333 — HTML lab, docx, deck links, Content OS index
pnpm dev:up   # Postgres + web (:3000) + cms (:3001) + demo slides (:5173); see scripts/dev-up.sh
pnpm build    # builds all packages
pnpm check    # type-checks all packages
pnpm lint     # lints via biome
pnpm generate:cms   # Payload `payload-types.ts` + admin `importMap.js` (needs DATABASE_URI; see docs/env.example)
pnpm scaffold:payload   # non-interactive `create-payload-app` blank + Postgres (see docs/scaffold-payload-blank.md)
```

### Table Content OS (this fork)

- **Hub**: `http://localhost:3333/` after `pnpm dev:html-lab` — index of every local tool, surface, and agent pipeline.
- **CMS**: `http://localhost:3001/admin` after `pnpm dev:up` (seed user `dev@example.com` / `dev` in development).
- **Slides**: `http://localhost:5173/` — `apps/demo/open-slide.config.ts` points `content.apiBaseUrl` at Payload REST.
- **Env**: copy variables from [docs/env.example](docs/env.example) into `apps/cms/.env` and, for agents, `apps/mcp-server/.env`.
- **MCP**: run `pnpm --filter mcp-server build` then point your MCP client at `apps/mcp-server/dist/index.js` (stdio transport).

## Support

If open-slide has been useful to you, consider supporting development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/D1D11YPUP1)

## License

MIT
