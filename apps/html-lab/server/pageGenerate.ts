/**
 * Page generator API.
 *
 * POST /api/page/generate
 *   { theme, content, title? }
 *   -> { ok, path, previewUrl, html, provider, model }
 *
 * Uses the existing OpenAI-compatible LLM router, so Tongyi/Qwen works once it
 * is configured in Studio admin.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Connect } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const routerUrl = pathToFileURL(
  path.join(repoRoot, 'skills/tableai-docx-master/lib/llm-router.mjs'),
).href;

const MAX_BODY_BYTES = 96 * 1024;
const MAX_CONTENT_CHARS = 12_000;
const GENERATE_TIMEOUT_MS =
  Number(process.env.DOCX_STUDIO_PAGE_GENERATE_TIMEOUT_MS ?? 120_000) || 120_000;

const THEMES = {
  atelier: {
    label: 'Atelier 深空金',
    direction:
      'deep navy, warm white, restrained champagne gold, premium editorial business deck, dense but elegant information architecture',
  },
  swiss: {
    label: 'Swiss 国际主义',
    direction:
      'white space, strict grid, black typography, crisp accent color, functional product brochure, clean data hierarchy',
  },
  magazine: {
    label: '电子杂志',
    direction:
      'editorial magazine, large serif-like Chinese headlines, warm paper background, textured sections, expressive pull quotes',
  },
  industrial: {
    label: '工业蓝图',
    direction:
      'industrial dashboard, blueprint grids, steel blue and graphite, capability matrices, technical credibility',
  },
} as const;

type ThemeId = keyof typeof THEMES;

type RouterModule = {
  chatCompletionsWithFallback: (opts: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
  }) => Promise<Record<string, unknown>>;
};

class TimeoutError extends Error {}

async function loadRouter(): Promise<RouterModule> {
  return import(/* @vite-ignore */ routerUrl) as Promise<RouterModule>;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(new TimeoutError(`page generation timed out after ${Math.round(ms / 1000)}s`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readJsonBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += b.byteLength;
    if (size > MAX_BODY_BYTES) throw new Error('request body too large');
    chunks.push(b);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
}

function send(res: import('node:http').ServerResponse, code: number, body: unknown): void {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  return base || `page-${new Date().toISOString().slice(0, 10)}`;
}

function cleanHtml(raw: string): string {
  let html = raw.trim();
  const fenced = html.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) html = fenced[1].trim();
  const start = html.search(/<!doctype html>|<html[\s>]/i);
  if (start > 0) html = html.slice(start).trim();
  if (!/<html[\s>]/i.test(html) || !/<\/html>/i.test(html)) {
    throw new Error('model did not return a complete HTML document');
  }
  if (Buffer.byteLength(html, 'utf8') > 900 * 1024) {
    throw new Error('generated HTML is too large');
  }
  return html;
}

function buildPrompt(theme: ThemeId, title: string, content: string): string {
  const t = THEMES[theme];
  return [
    `Create a polished single-file responsive HTML page in Chinese unless the source content is clearly English.`,
    `Theme: ${t.label}. Visual direction: ${t.direction}.`,
    `Title hint: ${title || 'derive a concise title from the content'}.`,
    '',
    'Requirements:',
    '- Return only a complete HTML document. No Markdown fences, no explanation.',
    '- Include inline CSS in <style>; no external images, fonts, scripts, or CDN dependencies.',
    '- Keep the HTML compact: under 35KB, under 450 lines, no huge SVG paths, no external assets.',
    '- First viewport must be the actual page experience, not a marketing explanation of the generator.',
    '- Use 4 to 6 semantic sections with strong typography, visible hierarchy, and responsive CSS.',
    '- Use metric cards, a short process/timeline, comparison grid, or capability matrix when useful.',
    '- Keep body copy concise; summarize the source instead of preserving every sentence.',
    '- Keep all text readable on 1280x720 and mobile widths; avoid overlapping elements.',
    '- Use a conservative amount of motion, CSS only.',
    '- Add a small footer with "Generated by TableAI Studio".',
    '',
    'Source content:',
    content.slice(0, MAX_CONTENT_CHARS),
  ].join('\n');
}

export function attachPageGenerateApi(middlewares: Connect.Server): void {
  middlewares.use(async (req, res, next) => {
    const url = req.url ?? '';
    if (req.method !== 'POST' || !url.startsWith('/api/page/generate')) {
      next();
      return;
    }

    try {
      const body = await readJsonBody(req);
      const content = String(body.content ?? '').trim();
      const title = String(body.title ?? '').trim();
      const themeRaw = String(body.theme ?? 'atelier') as ThemeId;
      const theme: ThemeId = themeRaw in THEMES ? themeRaw : 'atelier';

      if (content.length < 12) {
        send(res, 400, { ok: false, error: 'content is too short' });
        return;
      }

      const { chatCompletionsWithFallback } = await loadRouter();
      const result = await withTimeout(
        chatCompletionsWithFallback({
          temperature: 0.45,
          messages: [
            {
              role: 'system',
              content:
                'You are a senior product designer and frontend engineer. Produce production-quality standalone HTML pages.',
            },
            { role: 'user', content: buildPrompt(theme, title, content) },
          ],
        }),
        GENERATE_TIMEOUT_MS,
      );

      if (!result.ok || typeof result.content !== 'string') {
        send(res, 502, { ok: false, error: result.error ?? 'page generation failed' });
        return;
      }

      const html = cleanHtml(result.content);
      const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 12);
      const dir = path.join(repoRoot, 'landing01/generated');
      const filename = `${stamp}-${slugify(title || content.slice(0, 48))}.html`;
      const abs = path.join(dir, filename);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(abs, html, 'utf8');

      const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
      send(res, 200, {
        ok: true,
        path: rel,
        previewUrl: `/api/preview?path=${encodeURIComponent(rel)}`,
        html,
        provider: result.provider ?? null,
        model: result.model ?? null,
        theme,
      });
    } catch (e) {
      send(res, e instanceof TimeoutError ? 504 : 400, {
        ok: false,
        error: String(e instanceof Error ? e.message : e),
      });
    }
  });
}
