/**
 * LLM: raw paste → docx-master-compatible Markdown.
 * Env: DOCX_MASTER_AI_* or OPENAI_* (same pattern as kind-viewer layout AI).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chatCompletionsWithFallback, llmRouterStatus } from './llm-router.mjs';
import { getBrandTokens } from './pipeline.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FORMAT_SYSTEM = `You convert messy pasted text into clean Markdown for the docx-master Word pipeline.

Output ONLY the Markdown document — no preamble, no code fences.

Rules (strict):
- One # H1 title at top if a title is inferable
- Use ## for major sections, ### for subsections
- Use **bold** for labels like **What we do:** or **Key point:**
- Bullet lists: lines starting with "- " (hyphen space)
- Numbered lists: "1. " format
- Tables: GitHub pipe tables with header row + |---|---| separator
- Horizontal rules: --- on its own line between major sections
- Italic footer lines: *text* centered tone (date, confidentiality)
- Preserve all numbers, currency ($, ¥), names, and facts — do not invent data
- CJK + English mixed content: keep both languages as in source
- Do not use HTML; no nested bullets deeper than one em-dash sub-bullet under table rows if needed
- Keep KiND capitalisation when brand voice mentions KiND

If input is already valid Markdown, normalize spacing and heading levels only.`;

/** @deprecated use listLlmProviders from llm-router.mjs */
export function readDocxAiConfig() {
  const status = llmRouterStatus();
  if (!status.configured) return null;
  const primary = status.providers[0];
  return primary
    ? { apiKey: '(redacted)', baseUrl: primary.baseUrl, model: primary.model }
    : null;
}

export function llmStatus() {
  return llmRouterStatus();
}

/**
 * @param {string} text
 */
export function stripMarkdownFence(text) {
  const trimmed = text.trim();
  const m = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return m ? m[1].trim() : trimmed;
}

/**
 * @param {{ raw: string, brandPath?: string, hint?: string, locale?: string }} opts
 */
export async function formatRawToMarkdown({ raw, brandPath, hint, locale }) {
  const status = llmRouterStatus();
  if (!status.configured) {
    return {
      ok: false,
      error:
        'LLM not configured. Set DOCX_MASTER_AI_API_KEY, DOCX_MASTER_AI_FALLBACK_API_KEY, or OPENAI_API_KEY.',
      source: 'none',
    };
  }

  let brandContext = '';
  if (brandPath) {
    try {
      const tokens = await getBrandTokens(brandPath);
      brandContext = `Brand: ${tokens.name}. Voice/header hint: ${tokens.headerText || tokens.name}.`;
    } catch {
      /* optional */
    }
  }

  const userParts = [
    brandContext,
    locale ? `Locale: ${locale}` : '',
    hint ? `User hint: ${hint}` : '',
    '',
    '--- RAW INPUT ---',
    raw.slice(0, 120_000),
  ].filter(Boolean);

  const llm = await chatCompletionsWithFallback({
    temperature: 0.2,
    messages: [
      { role: 'system', content: FORMAT_SYSTEM },
      { role: 'user', content: userParts.join('\n') },
    ],
  });

  if (!llm.ok || !llm.content) {
    return {
      ok: false,
      error: llm.error ?? 'LLM request failed',
      source: 'llm',
      attempts: llm.attempts,
    };
  }

  const markdown = stripMarkdownFence(llm.content);
  return {
    ok: true,
    markdown,
    source: 'llm',
    model: llm.model,
    provider: llm.provider,
  };
}

export async function agentWorkflowDoc() {
  const skillPath = path.join(__dirname, '../SKILL.md');
  let skill = '';
  try {
    skill = await fs.readFile(skillPath, 'utf8');
  } catch {
    skill = 'See skills/tableai-docx-master/SKILL.md';
  }
  return `# docx-master agent workflow

## Recommended tool sequence

1. **list_brands** — pick \`modules/<brand>/design.md\`
2. **docx_format_text** — raw paste → Markdown (LLM)
3. **docx_build** — Markdown → .docx + validate + PNG previews
4. One shot: **docx_format_and_build**

## GUI

\`pnpm dev:html-lab\` → http://localhost:3333/docx

## Environment

Primary: DOCX_MASTER_AI_API_KEY (+ optional DOCX_MASTER_AI_FALLBACK_* / OPENAI_*)
Or DOCX_MASTER_AI_PROVIDERS JSON array for explicit failover chain.

## Skill

${skill.slice(0, 4000)}
`;
}
