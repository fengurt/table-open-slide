/**
 * Lightweight whole-site gate for the public Studio shell.
 *
 * It uses HTTP Basic auth so the browser can unlock the whole origin quickly.
 * In production it defaults to:
 *   user: DOCX_STUDIO_SITE_USER || "studio"
 *   pin:  DOCX_STUDIO_SITE_PIN || DOCX_STUDIO_TOKEN
 *
 * Keep DOCX_STUDIO_TOKEN as the fallback so existing deployments can be locked
 * without recreating containers with a new env var.
 */
import { timingSafeEqual } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { Connect } from 'vite';

const SITE_USER = process.env.DOCX_STUDIO_SITE_USER?.trim() || 'studio';
const SITE_PIN =
  process.env.DOCX_STUDIO_SITE_PIN?.trim() || process.env.DOCX_STUDIO_TOKEN?.trim() || '';

// Keep infrastructure probes readable; everything useful still needs the gate.
const PUBLIC_PATHS = new Set(['/api/lab/health', '/api/lab-health']);

let warned = false;

function warnOnce(): void {
  if (warned) return;
  warned = true;
  if (!SITE_PIN) {
    console.warn(
      '[site-gate] DOCX_STUDIO_SITE_PIN and DOCX_STUDIO_TOKEN are unset — site gate is DISABLED.',
    );
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

function parseBasic(auth: string): { user: string; pin: string } | null {
  if (!auth.startsWith('Basic ')) return null;
  try {
    const raw = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const idx = raw.indexOf(':');
    if (idx < 0) return null;
    return { user: raw.slice(0, idx), pin: raw.slice(idx + 1) };
  } catch {
    return null;
  }
}

function challenge(res: ServerResponse): void {
  res.statusCode = 401;
  res.setHeader('WWW-Authenticate', 'Basic realm="TableAI Studio", charset="UTF-8"');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Authentication required');
}

export function attachSiteGate(middlewares: Connect.Server): void {
  warnOnce();
  middlewares.use((req, res, next) => {
    if (!SITE_PIN) {
      next();
      return;
    }

    const pathname = (req.url ?? '').split('?')[0];
    if (PUBLIC_PATHS.has(pathname)) {
      next();
      return;
    }

    const credentials = parseBasic((req.headers.authorization ?? '').toString());
    if (
      !credentials ||
      !constantTimeEqual(credentials.user, SITE_USER) ||
      !constantTimeEqual(credentials.pin, SITE_PIN)
    ) {
      challenge(res);
      return;
    }

    next();
  });
}
