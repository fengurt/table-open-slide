import { ATELIER_PROJECTS, type AtelierProject } from './projects';

/** Single registry for the Lab homepage — every major repo capability in one place. */

export type HubLink =
  | { kind: 'route'; to: string }
  | { kind: 'external'; href: string }
  | { kind: 'command'; command: string; doc?: string };

export type HubEntry = {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  meta: string;
  link: HubLink;
};

export type HubSection = {
  id: string;
  title: string;
  hint?: string;
  entries: HubEntry[];
};

/** Built-in routes on this app (port 3333). */
export const HUB_STUDIO: HubSection = {
  id: 'studio',
  title: 'Studio · this hub',
  hint: 'pnpm dev:html-lab → http://localhost:3333',
  entries: [
    {
      id: 'html-lab',
      tag: 'HTML',
      title: 'HTML Lab',
      subtitle: 'Edit · preview · export',
      description:
        'Scan landing01/ and slides/ HTML. Iframe preview, Turndown → Markdown, live MD→HTML tuning, PNG export, auto-layout.',
      meta: '/lab',
      link: { kind: 'route', to: '/lab' },
    },
    {
      id: 'docx-master',
      tag: 'Word',
      title: 'docx-master',
      subtitle: 'Paste · format · preview',
      description:
        'LLM formats raw paste → Markdown, then brand-locked .docx via docx-js. Switch KiND / Atelier design.md; validate & PNG preview.',
      meta: '/docx · MCP',
      link: { kind: 'route', to: '/docx' },
    },
    {
      id: 'page-generator',
      tag: 'AI',
      title: 'AI Page Generator',
      subtitle: 'Theme · prompt · HTML',
      description:
        'Choose a visual theme, paste content, and generate a standalone HTML page through the configured Tongyi/Qwen-compatible LLM.',
      meta: '/projects',
      link: { kind: 'route', to: '/projects' },
    },
  ],
};

/** Separate dev servers — start with the listed pnpm script. */
export const HUB_RUNTIMES: HubSection = {
  id: 'runtimes',
  title: 'Slide runtimes',
  hint: 'Each app owns its own port · or run full stack',
  entries: [
    {
      id: 'dev-stack',
      tag: 'Stack',
      title: 'Full dev stack',
      subtitle: 'Postgres + CMS + web + demo',
      description:
        'One command starts Postgres :5432, marketing/docs :3000, Payload CMS :3001, open-slide demo :5173.',
      meta: 'pnpm dev:up',
      link: {
        kind: 'command',
        command: 'pnpm dev:up',
        doc: 'scripts/dev-up.sh',
      },
    },
    {
      id: 'open-slide-demo',
      tag: 'React',
      title: 'open-slide demo',
      subtitle: '1920×1080 · inspector · present',
      description:
        'Framework dogfood: React slide decks, in-browser inspector, presenter mode, CMS bindings. Agent skills under apps/demo/.claude/skills/.',
      meta: ':5173 · pnpm dev:up',
      link: { kind: 'external', href: 'http://localhost:5173/' },
    },
    {
      id: 'kind-viewer',
      tag: 'KiND',
      title: 'kind-viewer',
      subtitle: 'Markdown → HTML deck',
      description:
        'KiND business-plan deck (slides/kind-bp01/kind_presentation/). Layout JSON, MD authoring skill, polish & fix scripts.',
      meta: ':5190 · pnpm dev:kind-viewer',
      link: { kind: 'external', href: 'http://localhost:5190/' },
    },
    {
      id: 'taiyuan-storyline',
      tag: 'Event',
      title: 'taiyuan-storyline',
      subtitle: 'Event slide storyline',
      description:
        'Interactive viewer for event/20260514taiyuan HTML slides — manifest scan, iframe preview, chapter navigation.',
      meta: ':5188 · pnpm dev:taiyuan-storyline',
      link: { kind: 'external', href: 'http://localhost:5188/' },
    },
  ],
};

/** Table Content OS stack from scripts/dev-up.sh + @table/content surfaces. */
export const HUB_CONTENT_OS: HubSection = {
  id: 'content-os',
  title: 'Content OS',
  hint: 'pnpm dev:up — Postgres :5432, web :3000, cms :3001, demo :5173',
  entries: [
    {
      id: 'web-docs',
      tag: 'Docs',
      title: 'Marketing & docs',
      subtitle: 'Fumadocs site',
      description: 'Public marketing and documentation site (apps/web).',
      meta: ':3000',
      link: { kind: 'external', href: 'http://localhost:3000/' },
    },
    {
      id: 'cms-admin',
      tag: 'CMS',
      title: 'Payload CMS',
      subtitle: 'Content blocks · media · slides',
      description:
        'Localized content-blocks, slide bindings, comments. Dev seed: dev@example.com / dev.',
      meta: ':3001/admin',
      link: { kind: 'external', href: 'http://localhost:3001/admin' },
    },
    {
      id: 'brief',
      tag: 'Surface',
      title: 'Brief',
      subtitle: '@table/content binding',
      description: 'Executive brief surface consuming Payload REST.',
      meta: ':3010 · pnpm --filter brief dev',
      link: { kind: 'external', href: 'http://localhost:3010/' },
    },
    {
      id: 'financials',
      tag: 'Surface',
      title: 'Financials',
      subtitle: '@table/content binding',
      description: 'Financial reporting surface.',
      meta: ':3011 · pnpm --filter financials dev',
      link: { kind: 'external', href: 'http://localhost:3011/' },
    },
    {
      id: 'training',
      tag: 'Surface',
      title: 'Training',
      subtitle: '@table/content binding',
      description: 'Training program content surface.',
      meta: ':3012 · pnpm --filter training dev',
      link: { kind: 'external', href: 'http://localhost:3012/' },
    },
    {
      id: 'sops',
      tag: 'Surface',
      title: 'SOPs',
      subtitle: '@table/content binding',
      description: 'Standard operating procedures surface.',
      meta: ':3013 · pnpm --filter sops dev',
      link: { kind: 'external', href: 'http://localhost:3013/' },
    },
    {
      id: 'marketing-kit',
      tag: 'Surface',
      title: 'Marketing kit',
      subtitle: '@table/content binding',
      description: 'Marketing assets and kit surface.',
      meta: ':3014 · pnpm --filter marketing-kit dev',
      link: { kind: 'external', href: 'http://localhost:3014/' },
    },
    {
      id: 'succession-plan',
      tag: 'Surface',
      title: 'Succession plan',
      subtitle: '@table/content binding',
      description: 'Succession planning content surface.',
      meta: ':3015 · pnpm --filter succession-plan dev',
      link: { kind: 'external', href: 'http://localhost:3015/' },
    },
    {
      id: 'website',
      tag: 'Surface',
      title: 'Website',
      subtitle: '@table/content binding',
      description: 'Primary website surface (run separately from apps/web if both needed).',
      meta: 'pnpm --filter website dev',
      link: { kind: 'external', href: 'http://localhost:3000/' },
    },
  ],
};

/** MCP servers and CLI pipelines for agents. */
export const HUB_AGENTS: HubSection = {
  id: 'agents',
  title: 'Agent & MCP pipelines',
  hint: 'Stdio MCP — wire in Cursor settings; see docs/mcp-docx-master.example.json',
  entries: [
    {
      id: 'docx-mcp',
      tag: 'MCP',
      title: 'docx-master MCP',
      subtitle: 'Paste → MD → .docx',
      description:
        'Tools: docx_format_text, docx_format_and_build, docx_validate, docx_preview, list_brands. Resource docx://workflow.',
      meta: 'pnpm docx:mcp:build',
      link: {
        kind: 'command',
        command: 'pnpm docx:mcp:build',
        doc: 'docs/mcp-docx-master.example.json',
      },
    },
    {
      id: 'payload-mcp',
      tag: 'MCP',
      title: 'Payload content MCP',
      subtitle: 'CMS over REST',
      description:
        'list_content, get_content, update_content, bind_slide, … Requires CMS running and apps/mcp-server/.env.',
      meta: 'pnpm --filter mcp-server build',
      link: {
        kind: 'command',
        command: 'pnpm --filter mcp-server build',
        doc: 'apps/mcp-server/',
      },
    },
    {
      id: 'ppt-master',
      tag: 'PPTX',
      title: 'ppt-master',
      subtitle: 'Native DrawingML .pptx',
      description:
        'Strategist → Image → Executor pipeline. Vendored modules/tableai-ppt-master. Skill: .cursor/skills/ppt-master/SKILL.md.',
      meta: 'pnpm sync:ppt-master',
      link: {
        kind: 'command',
        command: 'pnpm sync:ppt-master',
        doc: 'modules/tableai-ppt-master/skills/ppt-master/SKILL.md',
      },
    },
    {
      id: 'guizang-skill',
      tag: 'HTML',
      title: 'guizang HTML decks',
      subtitle: 'Agent skill · static HTML',
      description:
        'HTML presentation skill for agent-authored guizang decks. Demo atelier showcase in skills/tableai-guizang-ppt-skill/demo/.',
      meta: 'skills/tableai-guizang-ppt-skill/',
      link: {
        kind: 'command',
        command: 'pnpm generate:skill-demo',
        doc: 'skills/tableai-guizang-ppt-skill/SKILL.md',
      },
    },
    {
      id: 'docx-cli',
      tag: 'CLI',
      title: 'docx CLI',
      subtitle: 'Markdown file → Word',
      description:
        'Headless build, validate, preview without GUI. Uses modules/*/design.md brand tokens.',
      meta: 'pnpm docx:from-md:build',
      link: {
        kind: 'command',
        command: 'pnpm docx:from-md:build',
        doc: 'skills/tableai-docx-master/SKILL.md',
      },
    },
    {
      id: 'kind-deck-authoring',
      tag: 'KiND',
      title: 'kind-deck-authoring',
      subtitle: 'Markdown deck skill',
      description:
        'Agent skill for slides/kind-bp01/kind_presentation/. After bulk MD edits run pnpm fix:kind-md.',
      meta: 'apps/kind-viewer/skills/',
      link: {
        kind: 'command',
        command: 'pnpm fix:kind-md',
        doc: 'apps/kind-viewer/skills/kind-deck-authoring/SKILL.md',
      },
    },
    {
      id: 'open-slide-cli',
      tag: 'CLI',
      title: 'open-slide init',
      subtitle: 'Scaffold new deck workspace',
      description:
        'Ships agent skills for /create-slide and /slide-authoring. Published @open-slide/cli + @open-slide/core.',
      meta: 'npx @open-slide/cli init',
      link: { kind: 'command', command: 'npx @open-slide/cli init my-deck', doc: 'packages/cli/' },
    },
  ],
};

export const HUB_SECTIONS: HubSection[] = [HUB_STUDIO, HUB_RUNTIMES, HUB_CONTENT_OS, HUB_AGENTS];

/** Deck journeys: in-hub previews plus external viewers. */
export function projectToHubEntry(p: AtelierProject): HubEntry {
  return {
    id: p.id,
    tag: p.tags[0] ?? 'deck',
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    meta: `${p.slideCount} slides · /project/`,
    link: { kind: 'route', to: `/project/${p.id}` },
  };
}

export const STATIC_EXTERNAL_DECK_JOURNEYS: HubEntry[] = [
  {
    id: 'kind-bp01',
    tag: 'KiND',
    title: 'KiND business plan',
    subtitle: 'Markdown deck · kind-viewer',
    description:
      'Board / investor narrative under slides/kind-bp01/kind_presentation/. Author with kind-deck-authoring skill.',
    meta: '19 slides · :5190',
    link: { kind: 'external', href: 'http://localhost:5190/' },
  },
];

export const HUB_DECK_JOURNEYS: HubEntry[] = [
  ...ATELIER_PROJECTS.map(projectToHubEntry),
  ...STATIC_EXTERNAL_DECK_JOURNEYS,
];
