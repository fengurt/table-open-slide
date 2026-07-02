/**
 * Lightweight whole-site gate for the public Studio shell.
 *
 * Browsers get a branded login page + HttpOnly cookie. HTTP Basic auth is still
 * accepted for scripts and quick curl checks.
 * In production it defaults to:
 *   user: DOCX_STUDIO_SITE_USER || "studio"
 *   pin:  DOCX_STUDIO_SITE_PIN || DOCX_STUDIO_TOKEN
 *
 * Keep DOCX_STUDIO_TOKEN as the fallback so existing deployments can be locked
 * without recreating containers with a new env var.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { Connect } from 'vite';

const SITE_USER = process.env.DOCX_STUDIO_SITE_USER?.trim() || 'studio';
const SITE_PIN =
  process.env.DOCX_STUDIO_SITE_PIN?.trim() || process.env.DOCX_STUDIO_TOKEN?.trim() || '';
const COOKIE_NAME = 'tableai_studio_gate';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;
const MAX_LOGIN_BODY_BYTES = 16 * 1024;

// Keep infrastructure probes readable; everything useful still needs the gate.
const PUBLIC_PATHS = new Set(['/api/lab/health', '/api/lab-health', '/api/site-login']);

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

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (cookieHeader ?? '').split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function authSignature(): string {
  return createHmac('sha256', SITE_PIN).update(`${SITE_USER}:tableai-studio`).digest('base64url');
}

function isValidCookie(req: Connect.IncomingMessage): boolean {
  const cookie = parseCookies(req.headers.cookie)[COOKIE_NAME];
  return !!cookie && constantTimeEqual(cookie, authSignature());
}

function isSecureRequest(req: Connect.IncomingMessage): boolean {
  const proto = req.headers['x-forwarded-proto'];
  if (Array.isArray(proto) ? proto.includes('https') : proto === 'https') return true;
  const host = String(req.headers.host ?? '');
  return !host.includes('127.0.0.1') && !host.includes('localhost');
}

function setAuthCookie(req: Connect.IncomingMessage, res: ServerResponse): void {
  const secure = isSecureRequest(req) ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(authSignature())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE_SECONDS}${secure}`,
  );
}

async function readLoginBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += b.byteLength;
    if (size > MAX_LOGIN_BODY_BYTES) throw new Error('request body too large');
    chunks.push(b);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  const contentType = String(req.headers['content-type'] ?? '');
  if (contentType.includes('application/json')) {
    return JSON.parse(raw) as Record<string, unknown>;
  }
  const params = new URLSearchParams(raw);
  return Object.fromEntries(params.entries());
}

function sendJson(res: ServerResponse, code: number, body: unknown): void {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function loginPage(error = ''): string {
  const user = escapeHtml(SITE_USER);
  const errorHtml = error
    ? `<p class="error" role="alert">${escapeHtml(error)}</p>`
    : '<p class="hint">Use the shared Studio PIN. API actions still require the Studio token inside the app.</p>';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TableAI Studio Access</title>
  <style>
    :root {
      --ink: #07111f;
      --panel: rgba(255,255,255,.88);
      --line: rgba(7,17,31,.14);
      --gold: #b89658;
      --red: #9f2d2d;
      --muted: rgba(7,17,31,.58);
      color-scheme: light;
      font-family: "Avenir Next", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    html, body { min-height: 100%; margin: 0; }
    body {
      display: grid;
      place-items: center;
      padding: 32px;
      overflow: hidden;
      color: var(--ink);
      background:
        linear-gradient(115deg, rgba(184,150,88,.18), transparent 34%),
        radial-gradient(circle at 80% 18%, rgba(255,255,255,.9), transparent 24%),
        linear-gradient(135deg, #f8f4eb 0%, #eef3f7 42%, #dde5ec 100%);
    }
    body::before {
      content: "";
      position: fixed;
      inset: 18px;
      border: 1px solid rgba(7,17,31,.12);
      pointer-events: none;
    }
    body::after {
      content: "TABLEAI";
      position: fixed;
      right: -2vw;
      bottom: -4vh;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(88px, 18vw, 240px);
      letter-spacing: .04em;
      color: rgba(7,17,31,.045);
      pointer-events: none;
    }
    main {
      width: min(1040px, 100%);
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(360px, .75fr);
      min-height: 620px;
      background: var(--panel);
      border: 1px solid var(--line);
      box-shadow: 0 34px 90px rgba(7,17,31,.18);
      backdrop-filter: blur(24px);
      position: relative;
      z-index: 1;
    }
    .story {
      padding: clamp(36px, 6vw, 72px);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-right: 1px solid var(--line);
      background:
        linear-gradient(180deg, rgba(255,255,255,.28), transparent),
        repeating-linear-gradient(90deg, rgba(7,17,31,.035) 0 1px, transparent 1px 78px);
    }
    .mark {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      letter-spacing: .24em;
      text-transform: uppercase;
      color: rgba(7,17,31,.68);
    }
    .mark::before { content: ""; width: 38px; height: 1px; background: var(--gold); }
    h1 {
      max-width: 640px;
      margin: 58px 0 0;
      font-family: "Songti SC", "Noto Serif SC", Georgia, serif;
      font-weight: 600;
      font-size: clamp(44px, 6.4vw, 86px);
      line-height: .96;
      letter-spacing: 0;
    }
    .lead {
      max-width: 520px;
      margin: 28px 0 0;
      color: var(--muted);
      font-size: clamp(16px, 1.7vw, 20px);
      line-height: 1.72;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-top: 54px;
    }
    .meta div {
      min-height: 88px;
      padding: 14px 0 0;
      border-top: 1px solid rgba(7,17,31,.16);
    }
    .meta span {
      display: block;
      color: var(--muted);
      font-size: 11px;
      letter-spacing: .18em;
      text-transform: uppercase;
    }
    .meta strong {
      display: block;
      margin-top: 10px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 26px;
      font-weight: 500;
    }
    .gate {
      padding: clamp(30px, 4.8vw, 58px);
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: rgba(255,255,255,.48);
    }
    .gate h2 {
      margin: 0;
      font-family: "Songti SC", "Noto Serif SC", Georgia, serif;
      font-size: 32px;
      font-weight: 600;
    }
    .gate p { margin: 10px 0 0; color: var(--muted); line-height: 1.65; }
    .account {
      margin: 28px 0 22px;
      padding: 18px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,.6);
    }
    .account span {
      display: block;
      color: var(--muted);
      font-size: 11px;
      letter-spacing: .18em;
      text-transform: uppercase;
    }
    .account code {
      display: block;
      margin-top: 8px;
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: 22px;
      color: var(--ink);
    }
    label {
      display: block;
      margin: 18px 0 8px;
      color: rgba(7,17,31,.72);
      font-size: 12px;
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    input {
      width: 100%;
      height: 54px;
      border: 1px solid rgba(7,17,31,.18);
      background: rgba(255,255,255,.78);
      border-radius: 0;
      padding: 0 16px;
      color: var(--ink);
      font-size: 18px;
      outline: none;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    input:focus {
      border-color: rgba(184,150,88,.9);
      box-shadow: 0 0 0 4px rgba(184,150,88,.16);
    }
    button {
      width: 100%;
      height: 56px;
      margin-top: 18px;
      border: 0;
      background: var(--ink);
      color: white;
      font-size: 13px;
      letter-spacing: .18em;
      text-transform: uppercase;
      cursor: pointer;
      transition: transform .2s ease, background .2s ease;
    }
    button:hover { transform: translateY(-1px); background: #111f32; }
    .error { color: var(--red) !important; }
    .fine {
      margin-top: 24px !important;
      font-size: 12px;
      color: rgba(7,17,31,.46) !important;
    }
    @media (max-width: 820px) {
      body { padding: 18px; overflow: auto; }
      body::before { inset: 10px; }
      main { grid-template-columns: 1fr; min-height: 0; }
      .story { border-right: 0; border-bottom: 1px solid var(--line); }
      .meta { grid-template-columns: 1fr; margin-top: 36px; }
      .meta div { min-height: 0; }
    }
  </style>
</head>
<body>
  <main>
    <section class="story" aria-label="Studio introduction">
      <div>
        <span class="mark">TableAI Studio</span>
        <h1>Private slide operations, quietly protected.</h1>
        <p class="lead">A gated workspace for project decks, generated pages, and executive previews. Access is intentionally limited to keep the public endpoint calm.</p>
      </div>
      <div class="meta" aria-label="Workspace status">
        <div><span>Access</span><strong>PIN</strong></div>
        <div><span>Surface</span><strong>Slides</strong></div>
        <div><span>Mode</span><strong>Studio</strong></div>
      </div>
    </section>
    <section class="gate" aria-label="Sign in">
      <h2>Enter Studio</h2>
      ${errorHtml}
      <div class="account">
        <span>Account</span>
        <code>${user}</code>
      </div>
      <form method="post" action="/api/site-login">
        <input type="hidden" name="redirect" value="/">
        <label for="pin">Studio PIN</label>
        <input id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" autofocus required>
        <button type="submit">Unlock workspace</button>
      </form>
      <p class="fine">For automation, HTTP Basic auth remains available with the same account and PIN.</p>
    </section>
  </main>
</body>
</html>`;
}

function challenge(req: Connect.IncomingMessage, res: ServerResponse, pathname: string): void {
  const acceptsHtml = String(req.headers.accept ?? '').includes('text/html');
  if (req.method === 'GET' && (acceptsHtml || !pathname.startsWith('/api/'))) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(loginPage());
    return;
  }
  sendJson(res, 401, { ok: false, error: 'authentication required' });
}

export function attachSiteGate(middlewares: Connect.Server): void {
  warnOnce();
  middlewares.use(async (req, res, next) => {
    if (!SITE_PIN) {
      next();
      return;
    }

    const pathname = (req.url ?? '').split('?')[0];
    if (PUBLIC_PATHS.has(pathname)) {
      if (pathname === '/api/site-login' && req.method === 'POST') {
        try {
          const body = await readLoginBody(req);
          const user = String(body.user ?? SITE_USER).trim();
          const pin = String(body.pin ?? '').trim();
          if (constantTimeEqual(user, SITE_USER) && constantTimeEqual(pin, SITE_PIN)) {
            setAuthCookie(req, res);
            const redirect = String(body.redirect ?? '/');
            res.statusCode = 303;
            res.setHeader('Location', redirect.startsWith('/') ? redirect : '/');
            res.end();
            return;
          }
          res.statusCode = 401;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(loginPage('The PIN did not match. Check the shared Studio access note.'));
          return;
        } catch (e) {
          sendJson(res, 400, { ok: false, error: String(e instanceof Error ? e.message : e) });
          return;
        }
      }
      next();
      return;
    }

    const credentials = parseBasic((req.headers.authorization ?? '').toString());
    const hasBasic =
      !!credentials &&
      constantTimeEqual(credentials.user, SITE_USER) &&
      constantTimeEqual(credentials.pin, SITE_PIN);

    if (!hasBasic && !isValidCookie(req)) {
      challenge(req, res, pathname);
      return;
    }

    next();
  });
}
