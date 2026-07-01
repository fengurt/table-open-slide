/**
 * Shared-token auth gate + in-memory rate limit + upload size cap for the docx
 * studio API. Registered first in the middleware chain so it runs before any
 * route handler.
 *
 * Behaviour:
 *   - Only `/api/*` requests are gated; the static app shell stays public so the
 *     browser can load the UI and submit its stored token on API calls.
 *   - Token sources (any one): `Authorization: Bearer <t>`, `X-Docx-Token: <t>`,
 *     or cookie `docx_studio_token=<t>`. Compared with timingSafeEqual.
 *   - If `DOCX_STUDIO_TOKEN` is unset, auth is disabled (local dev). A startup
 *     warning is logged so this isn't silently shipped to production.
 *   - Public, unauthenticated reads: auth/status probes plus deck preview and
 *     manifest endpoints used by public `/project/:id` pages.
 *   - Write to `/api/raw-html` is blocked in production unless
 *     `DOCX_STUDIO_ALLOW_HTML_WRITE=1` (it can overwrite repo files).
 */
import { timingSafeEqual } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { Connect } from 'vite';
import { isAdminRequest } from './adminAuth.js';

const TOKEN = process.env.DOCX_STUDIO_TOKEN?.trim() ?? '';
const RATE_LIMIT = Number(process.env.DOCX_STUDIO_RATE_LIMIT ?? 120) || 120; // req/min/IP
const RATE_WINDOW_MS = 60_000;
const MAX_BODY_BYTES =
  Number(process.env.DOCX_STUDIO_MAX_BODY ?? 30 * 1024 * 1024) || 30 * 1024 * 1024;
const ALLOW_HTML_WRITE = process.env.DOCX_STUDIO_ALLOW_HTML_WRITE === '1';
const IS_PROD = process.env.NODE_ENV === 'production';

// The health probe drives the public hub's status dashboard, so it must stay
// reachable without a token. (Older builds whitelisted the wrong `/api/lab-health`
// path - the real endpoint is `/api/lab/health`; keep both for safety.)
const PUBLIC_PATHS = new Set(['/api/docx/auth-status', '/api/lab/health', '/api/lab-health']);

const PUBLIC_GET_PATHS = new Set(['/api/preview', '/api/project-manifest']);

let warned = false;
function warnOnce(): void {
  if (warned) return;
  warned = true;
  if (!TOKEN) {
    console.warn(
      '[docx-studio] DOCX_STUDIO_TOKEN is not set — API auth is DISABLED. Set it before exposing this service.',
    );
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Still compare to a fixed buffer to keep timing roughly constant.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

function extractToken(req: Connect.IncomingMessage): string {
  const auth = (req.headers.authorization ?? '').toString();
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const x = req.headers['x-docx-token'];
  if (typeof x === 'string' && x.trim()) return x.trim();
  const cookie = (req.headers.cookie ?? '').toString();
  const m = cookie.match(/(?:^|;\s*)docx_studio_token=([^;]+)/);
  if (m) return decodeURIComponent(m[1]);
  return '';
}

function clientIp(req: Connect.IncomingMessage): string {
  const fwd = (req.headers['x-forwarded-for'] ?? '').toString();
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

const buckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  b.count += 1;
  return b.count > RATE_LIMIT;
}

// Opportunistic cleanup so the bucket map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) {
    if (now > b.resetAt) buckets.delete(ip);
  }
}, RATE_WINDOW_MS).unref?.();

function deny(res: ServerResponse, code: number, error: string): void {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, error }));
}

export function attachAuthGate(middlewares: Connect.Server): void {
  warnOnce();
  middlewares.use((req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api/')) {
      next();
      return;
    }
    const pathname = url.split('?')[0];

    // Public probe: lets the UI learn whether a token is required.
    if (req.method === 'GET' && pathname === '/api/docx/auth-status') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true, required: Boolean(TOKEN) }));
      return;
    }

    const ip = clientIp(req);
    if (rateLimited(ip)) {
      deny(res, 429, 'rate limit exceeded — slow down');
      return;
    }

    // Body size cap for writes (defence in depth; handlers also cap).
    if (req.method === 'POST' || req.method === 'PUT') {
      const len = Number(req.headers['content-length'] ?? 0);
      if (len > MAX_BODY_BYTES) {
        deny(res, 413, `body too large (max ${Math.floor(MAX_BODY_BYTES / 1024 / 1024)}MB)`);
        return;
      }
    }

    // Block repo-file overwrites in production unless explicitly allowed.
    if (
      (req.method === 'PUT' || req.method === 'POST') &&
      pathname.startsWith('/api/raw-html') &&
      IS_PROD &&
      !ALLOW_HTML_WRITE
    ) {
      deny(res, 403, 'html write disabled in production (set DOCX_STUDIO_ALLOW_HTML_WRITE=1)');
      return;
    }

    const isPublicGet = req.method === 'GET' && PUBLIC_GET_PATHS.has(pathname);

    // Token enforcement. A valid admin session also satisfies the gate so a
    // logged-in admin can use the full app without the shared user token.
    if (TOKEN && !PUBLIC_PATHS.has(pathname) && !isPublicGet && !isAdminRequest(req)) {
      const provided = extractToken(req);
      if (!provided || !constantTimeEqual(provided, TOKEN)) {
        deny(res, 401, 'missing or invalid token');
        return;
      }
    }

    next();
  });
}
