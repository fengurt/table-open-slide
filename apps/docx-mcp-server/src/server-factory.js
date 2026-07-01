/**
 * Shared docx-master MCP server factory.
 *
 * Used by both transports:
 *   - src/index.js  → stdio (local skill, Cursor/Claude Desktop)
 *   - src/http.js   → streamable-HTTP (remote agents, token-gated)
 */
import fs from 'node:fs/promises';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { wrapAgentResult } from '../../../skills/tableai-docx-master/lib/agent-response.mjs';
import {
  agentWorkflowDoc,
  formatRawToMarkdown,
  llmStatus,
} from '../../../skills/tableai-docx-master/lib/format-markdown.mjs';
import {
  buildFromMarkdown,
  buildFromMarkdownFile,
  formatAndBuild,
  generateFromMarkdown,
  listBrands,
  previewDocx,
  repoRoot,
  validateDocx,
} from '../../../skills/tableai-docx-master/lib/pipeline.mjs';

function agentJson(obj, workflow, nextSteps) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(wrapAgentResult(obj, { workflow, nextSteps }), null, 2),
      },
    ],
  };
}

/** Build a fully-registered docx-master MCP server instance. */
export function createDocxMcpServer() {
  const server = new McpServer({
    name: 'docx-master',
    version: '0.2.0',
    description:
      'Brand-locked Word (.docx) from Markdown or raw paste. Use docx_format_and_build for copy-paste memos.',
  });

  server.registerResource(
    'workflow',
    new ResourceTemplate('docx://workflow', { list: undefined }),
    {
      title: 'docx-master agent workflow',
      description: 'Tool order, env vars, and skill summary for agents',
      mimeType: 'text/markdown',
    },
    async () => ({
      contents: [
        { uri: 'docx://workflow', mimeType: 'text/markdown', text: await agentWorkflowDoc() },
      ],
    }),
  );

  server.registerTool(
    'docx_llm_status',
    {
      title: 'LLM configuration status',
      description: 'Check if DOCX_MASTER_AI_API_KEY / OPENAI_API_KEY is set for docx_format_text.',
      inputSchema: {},
    },
    async () =>
      agentJson({ ok: true, ...llmStatus() }, 'status', ['Use docx_format_text when configured']),
  );

  server.registerTool(
    'list_brands',
    {
      title: 'List docx brand packs',
      description:
        'List modules/*/design.md tokens (KiND, Atelier). Pass path to brand param on other tools.',
      inputSchema: {},
    },
    async () =>
      agentJson(
        {
          ok: true,
          brands: await listBrands(),
          repoRoot: repoRoot(),
          defaultBrand: 'modules/kind-brand/design.md',
        },
        'list_brands',
        ['Pick brand path', 'Call docx_format_and_build or docx_build'],
      ),
  );

  server.registerTool(
    'docx_format_text',
    {
      title: 'Format raw paste → Markdown',
      description:
        'LLM converts messy pasted text (email, notes, chat export) into docx-master Markdown. Requires OPENAI_API_KEY or DOCX_MASTER_AI_API_KEY.',
      inputSchema: {
        raw: z.string().describe('Unstructured pasted content'),
        brand: z
          .string()
          .default('modules/kind-brand/design.md')
          .describe('Brand design.md for voice context'),
        hint: z.string().optional().describe('e.g. "board memo EN", "investor deck"'),
        locale: z.string().optional().describe('e.g. en, zh-CN'),
      },
    },
    async ({ raw, brand, hint, locale }) => {
      try {
        const result = await formatRawToMarkdown({ raw, brandPath: brand, hint, locale });
        return agentJson(
          result,
          'format',
          result.ok ? ['Review markdown', 'Call docx_build with markdown'] : [],
        );
      } catch (e) {
        return agentJson(
          { ok: false, error: String(e instanceof Error ? e.message : e) },
          'format',
          [],
        );
      }
    },
  );

  server.registerTool(
    'docx_format_and_build',
    {
      title: 'Paste → format → Word (one shot)',
      description:
        'Agent-friendly: raw text → LLM Markdown → generate → validate → preview PNGs. Best for copy-paste memos.',
      inputSchema: {
        raw: z.string().describe('Pasted unstructured content'),
        brand: z.string().default('modules/kind-brand/design.md'),
        hint: z.string().optional(),
        locale: z.string().optional(),
        pages: z.number().int().min(1).max(32).default(12).optional(),
      },
    },
    async ({ raw, brand, hint, locale, pages }) => {
      try {
        const result = await formatAndBuild({
          raw,
          brandPath: brand,
          hint,
          locale,
          pages: pages ?? 12,
        });
        return agentJson(result, 'format → build → validate → preview', []);
      } catch (e) {
        return agentJson(
          { ok: false, error: String(e instanceof Error ? e.message : e) },
          'format_and_build',
          [],
        );
      }
    },
  );

  server.registerTool(
    'docx_from_markdown',
    {
      title: 'Generate .docx from Markdown',
      description:
        'Create branded editable Word from Markdown + design.md. Returns paths under out/.',
      inputSchema: {
        markdown: z.string(),
        brand: z.string().default('modules/kind-brand/design.md'),
        outDir: z.string().default('out').optional(),
        filename: z.string().optional(),
      },
    },
    async ({ markdown, brand, outDir, filename }) => {
      try {
        const result = await generateFromMarkdown({
          markdown,
          brandPath: brand,
          outDir: outDir ?? 'out',
          filename,
        });
        return agentJson(result, 'generate', ['Run docx_preview or open GUI']);
      } catch (e) {
        return agentJson(
          { ok: false, error: String(e instanceof Error ? e.message : e) },
          'generate',
          [],
        );
      }
    },
  );

  server.registerTool(
    'docx_from_markdown_file',
    {
      title: 'Generate .docx from Markdown file',
      inputSchema: {
        mdPath: z.string(),
        brand: z.string().default('modules/kind-brand/design.md'),
        outDir: z.string().default('out').optional(),
      },
    },
    async ({ mdPath, brand, outDir }) => {
      try {
        const abs = mdPath.startsWith('/') ? mdPath : `${repoRoot()}/${mdPath}`;
        const markdown = await fs.readFile(abs, 'utf8');
        const result = await generateFromMarkdown({
          markdown,
          brandPath: brand,
          outDir: outDir ?? 'out',
        });
        return agentJson(result, 'generate from file', []);
      } catch (e) {
        return agentJson(
          { ok: false, error: String(e instanceof Error ? e.message : e) },
          'generate',
          [],
        );
      }
    },
  );

  server.registerTool(
    'docx_validate',
    {
      title: 'Validate .docx OOXML',
      inputSchema: { docx: z.string() },
    },
    async ({ docx }) => {
      try {
        return agentJson(await validateDocx(docx), 'validate', []);
      } catch (e) {
        return agentJson(
          { ok: false, error: String(e instanceof Error ? e.message : e) },
          'validate',
          [],
        );
      }
    },
  );

  server.registerTool(
    'docx_preview',
    {
      title: 'Preview .docx as PDF + PNGs',
      inputSchema: {
        docx: z.string(),
        pages: z.number().int().min(1).max(32).default(8).optional(),
      },
    },
    async ({ docx, pages }) => {
      try {
        return agentJson(await previewDocx(docx, pages ?? 8), 'preview', []);
      } catch (e) {
        return agentJson(
          { ok: false, error: String(e instanceof Error ? e.message : e) },
          'preview',
          [],
        );
      }
    },
  );

  server.registerTool(
    'docx_build',
    {
      title: 'Markdown → full pipeline',
      description: 'generate → validate → preview. Use when markdown is already structured.',
      inputSchema: {
        markdown: z.string().optional(),
        mdPath: z.string().optional(),
        brand: z.string().default('modules/kind-brand/design.md'),
        outDir: z.string().default('out').optional(),
        pages: z.number().int().min(1).max(32).default(8).optional(),
        filename: z.string().optional(),
      },
    },
    async ({ markdown, mdPath, brand, outDir, pages, filename }) => {
      try {
        if (mdPath) {
          const result = await buildFromMarkdownFile({
            mdPath,
            brandPath: brand,
            outDir: outDir ?? 'out',
            pages: pages ?? 8,
          });
          return agentJson(result, 'build from file', []);
        }
        if (!markdown) {
          return agentJson(
            { ok: false, error: 'Provide markdown, mdPath, or use docx_format_and_build' },
            'build',
            [],
          );
        }
        const result = await buildFromMarkdown({
          markdown,
          brandPath: brand,
          outDir: outDir ?? 'out',
          pages: pages ?? 8,
          filename,
        });
        return agentJson(result, 'build', []);
      } catch (e) {
        return agentJson(
          { ok: false, error: String(e instanceof Error ? e.message : e) },
          'build',
          [],
        );
      }
    },
  );

  return server;
}
