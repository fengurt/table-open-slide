#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const CMS_URL = (process.env.CMS_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
const API = `${CMS_URL}/api`;

async function cmsFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('accept', 'application/json');
  const apiKey = process.env.CMS_API_KEY;
  const token = process.env.CMS_JWT;
  if (apiKey) headers.set('Authorization', `users API-Key ${apiKey}`);
  else if (token) headers.set('Authorization', `JWT ${token}`);
  return fetch(`${API}${path.startsWith('/') ? path : `/${path}`}`, { ...init, headers });
}

async function ensureJwtFromPassword(): Promise<void> {
  if (process.env.CMS_JWT || process.env.CMS_API_KEY) return;
  const email = process.env.CMS_EMAIL ?? 'dev@example.com';
  const password = process.env.CMS_PASSWORD ?? 'dev';
  const res = await fetch(`${API}/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    console.error(
      `[mcp-server] login failed ${res.status} — set CMS_JWT, CMS_API_KEY, or CMS_EMAIL/CMS_PASSWORD`,
    );
    return;
  }
  const data = (await res.json()) as { token?: string };
  if (data.token) process.env.CMS_JWT = data.token;
}

const localeEnum = z.enum(['en', 'zh-CN', 'zh-TW', 'ja']);

const server = new McpServer({ name: 'table-content-os', version: '0.0.1' });

server.registerTool(
  'list_content',
  {
    title: 'List content blocks',
    description: 'List Payload content-blocks (optional key contains filter).',
    inputSchema: { prefix: z.string().optional() },
  },
  async ({ prefix }) => {
    const query = new URLSearchParams();
    query.set('limit', '50');
    query.set('depth', '0');
    if (prefix) query.set('where[key][contains]', prefix);
    const res = await cmsFetch(`/content-blocks?${query.toString()}`);
    const body = await res.text();
    return { content: [{ type: 'text' as const, text: body }] };
  },
);

server.registerTool(
  'get_content',
  {
    title: 'Get content block',
    description: 'Fetch a content-block by key for a locale.',
    inputSchema: {
      key: z.string(),
      locale: localeEnum.default('en'),
    },
  },
  async ({ key, locale }) => {
    const query = new URLSearchParams();
    query.set('where[key][equals]', key);
    query.set('locale', locale);
    query.set('limit', '1');
    const res = await cmsFetch(`/content-blocks?${query.toString()}`);
    const body = await res.text();
    return { content: [{ type: 'text' as const, text: body }] };
  },
);

server.registerTool(
  'update_content',
  {
    title: 'Update content block body',
    description: 'PATCH a content-block body for a locale.',
    inputSchema: {
      id: z.string(),
      locale: localeEnum,
      body: z.string(),
    },
  },
  async ({ id, locale, body }) => {
    const res = await cmsFetch(
      `/content-blocks/${encodeURIComponent(id)}?locale=${encodeURIComponent(locale)}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      },
    );
    const text = await res.text();
    return { content: [{ type: 'text' as const, text: text }] };
  },
);

server.registerTool(
  'create_translation',
  {
    title: 'Copy locale to another locale',
    description: 'Reads source locale body and PATCHes target locale.',
    inputSchema: {
      id: z.string(),
      fromLocale: localeEnum,
      toLocale: localeEnum,
    },
  },
  async ({ id, fromLocale, toLocale }) => {
    const q = new URLSearchParams();
    q.set('locale', fromLocale);
    const get = await cmsFetch(`/content-blocks/${encodeURIComponent(id)}?${q.toString()}`);
    const doc = (await get.json()) as { body?: string };
    const bodyText = doc.body ?? '';
    const res = await cmsFetch(
      `/content-blocks/${encodeURIComponent(id)}?locale=${encodeURIComponent(toLocale)}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: bodyText }),
      },
    );
    return { content: [{ type: 'text' as const, text: await res.text() }] };
  },
);

server.registerTool(
  'publish',
  {
    title: 'Publish placeholder',
    description: 'Placeholder for draft/publish workflows.',
    inputSchema: { id: z.string() },
  },
  async ({ id }) => ({
    content: [{ type: 'text' as const, text: JSON.stringify({ ok: true, id }) }],
  }),
);

server.registerTool(
  'bind_slide',
  {
    title: 'Bind slide to content key',
    description: 'POST a slide-bindings document.',
    inputSchema: {
      slideId: z.string(),
      contentKey: z.string(),
      nodeId: z.string().optional(),
    },
  },
  async ({ slideId, contentKey, nodeId }) => {
    const res = await cmsFetch('/slide-bindings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slideId, contentKey, nodeId: nodeId ?? '' }),
    });
    return { content: [{ type: 'text' as const, text: await res.text() }] };
  },
);

async function main() {
  await ensureJwtFromPassword();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
