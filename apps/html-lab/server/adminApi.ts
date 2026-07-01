/**
 * Admin API: password login + runtime LLM provider configuration.
 *
 * Routes (all under /api/docx/admin/):
 *   GET  /status          public — { adminEnabled, isAdmin }
 *   POST /login           { password } -> sets admin cookie
 *   POST /logout          clears admin cookie
 *   GET  /llm             admin — effective LLM config (keys masked) + source
 *   PUT  /llm             admin — { providers:[{id,baseUrl,model,apiKey}] } -> persist
 *   POST /llm/test        admin — runs a tiny completion against effective config
 *
 * Registered before authGate so admin login works without the shared user
 * token; the admin password is the gate for these routes.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Connect } from 'vite';
import {
  adminClearCookieHeader,
  adminCookieHeader,
  adminEnabled,
  createAdminSession,
  destroyAdminSession,
  isAdminRequest,
  readAdminCookie,
  verifyAdminPassword,
} from './adminAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const settingsUrl = pathToFileURL(
  path.join(repoRoot, 'skills/tableai-docx-master/lib/studio-settings.mjs'),
).href;
const routerUrl = pathToFileURL(
  path.join(repoRoot, 'skills/tableai-docx-master/lib/llm-router.mjs'),
).href;

type LlmProvider = { id: string; apiKey: string; baseUrl: string; model: string };

async function loadSettings() {
  return import(/* @vite-ignore */ settingsUrl) as Promise<{
    readStudioSettings: () => { llm?: { providers?: LlmProvider[] } };
    writeStudioSettings: (s: { llm?: { providers?: LlmProvider[] } }) => void;
    getStudioLlmProviders: () => LlmProvider[];
  }>;
}

async function loadRouter() {
  return import(/* @vite-ignore */ routerUrl) as Promise<{
    llmRouterStatus: () => Record<string, unknown>;
    chatCompletionsWithFallback: (opts: {
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
    }) => Promise<Record<string, unknown>>;
  }>;
}

async function readJsonBody(req: Connect.IncomingMessage, max = 256 * 1024): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += buf.length;
    if (size > max) throw new Error('body too large');
    chunks.push(buf);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function isSecure(req: Connect.IncomingMessage): boolean {
  const proto = (req.headers['x-forwarded-proto'] ?? '').toString();
  if (proto) return proto.split(',')[0].trim() === 'https';
  return Boolean((req.socket as { encrypted?: boolean })?.encrypted);
}

function send(res: import('node:http').ServerResponse, code: number, body: unknown): void {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function keyHint(key: string): string {
  const k = key.trim();
  if (k.length <= 4) return '••••';
  return `••••${k.slice(-4)}`;
}

export function attachAdminApi(middlewares: Connect.Server): void {
  middlewares.use(async (req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api/docx/admin/')) {
      next();
      return;
    }
    const pathname = url.split('?')[0];

    try {
      // Public: lets the UI decide whether to show the admin login.
      if (req.method === 'GET' && pathname === '/api/docx/admin/status') {
        send(res, 200, {
          ok: true,
          adminEnabled: adminEnabled(),
          isAdmin: isAdminRequest(req),
        });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/docx/admin/login') {
        if (!adminEnabled()) {
          send(res, 400, { ok: false, error: 'admin login is disabled (no admin password set)' });
          return;
        }
        const body = (await readJsonBody(req)) as { password?: string };
        if (!body.password || !verifyAdminPassword(body.password)) {
          send(res, 401, { ok: false, error: 'invalid password' });
          return;
        }
        const id = createAdminSession();
        res.setHeader('Set-Cookie', adminCookieHeader(id, isSecure(req)));
        send(res, 200, { ok: true, isAdmin: true });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/docx/admin/logout') {
        const id = readAdminCookie(req);
        if (id) destroyAdminSession(id);
        res.setHeader('Set-Cookie', adminClearCookieHeader(isSecure(req)));
        send(res, 200, { ok: true });
        return;
      }

      // Everything below requires a valid admin session.
      if (!isAdminRequest(req)) {
        send(res, 401, { ok: false, error: 'admin session required' });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/docx/admin/llm') {
        const { readStudioSettings } = await loadSettings();
        const { llmRouterStatus } = await loadRouter();
        const stored = readStudioSettings()?.llm?.providers ?? [];
        const providers = stored.map((p) => ({
          id: p.id,
          baseUrl: p.baseUrl,
          model: p.model,
          hasKey: Boolean(p.apiKey?.trim()),
          keyHint: p.apiKey?.trim() ? keyHint(p.apiKey) : '',
        }));
        send(res, 200, { ok: true, providers, status: llmRouterStatus() });
        return;
      }

      if (req.method === 'PUT' && pathname === '/api/docx/admin/llm') {
        const { readStudioSettings, writeStudioSettings } = await loadSettings();
        const body = (await readJsonBody(req)) as {
          providers?: Array<Partial<LlmProvider>>;
        };
        const incoming = Array.isArray(body.providers) ? body.providers : [];
        const prior = readStudioSettings()?.llm?.providers ?? [];
        const priorById = new Map(prior.map((p) => [p.id, p]));

        const cleaned: LlmProvider[] = [];
        for (let i = 0; i < incoming.length; i++) {
          const p = incoming[i] ?? {};
          const id = String(p.id ?? `provider-${i}`).trim() || `provider-${i}`;
          const baseUrl = String(p.baseUrl ?? '').trim() || 'https://api.openai.com/v1';
          const model = String(p.model ?? '').trim() || 'gpt-4o-mini';
          // Blank apiKey means "keep existing" (UI never echoes the real key).
          const submitted = typeof p.apiKey === 'string' ? p.apiKey.trim() : '';
          const apiKey = submitted || priorById.get(id)?.apiKey?.trim() || '';
          if (!apiKey) continue; // drop providers without a usable key
          cleaned.push({ id, baseUrl: baseUrl.replace(/\/$/, ''), model, apiKey });
        }

        const settings = readStudioSettings();
        settings.llm = { providers: cleaned };
        writeStudioSettings(settings);

        const { llmRouterStatus } = await loadRouter();
        send(res, 200, { ok: true, providerCount: cleaned.length, status: llmRouterStatus() });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/docx/admin/llm/test') {
        const { chatCompletionsWithFallback } = await loadRouter();
        const result = await chatCompletionsWithFallback({
          messages: [
            { role: 'system', content: 'Reply with the single word: ok' },
            { role: 'user', content: 'ping' },
          ],
          temperature: 0,
        });
        if (result.ok) {
          send(res, 200, {
            ok: true,
            provider: result.provider ?? null,
            model: result.model ?? null,
            reply: String(result.content ?? '').slice(0, 80),
          });
        } else {
          send(res, 502, { ok: false, error: result.error ?? 'LLM test failed' });
        }
        return;
      }

      send(res, 404, { ok: false, error: 'not found' });
    } catch (e) {
      send(res, 400, { ok: false, error: String(e instanceof Error ? e.message : e) });
    }
  });
}
