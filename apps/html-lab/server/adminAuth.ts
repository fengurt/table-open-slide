/**
 * Admin session management for the docx studio.
 *
 * Two-role model: regular users authenticate with the shared `DOCX_STUDIO_TOKEN`
 * (handled by authGate); an admin authenticates with `DOCX_STUDIO_ADMIN_PASSWORD`
 * to unlock the settings panel (e.g. configuring the LLM provider at runtime).
 *
 * Sessions are opaque random ids stored in-memory and carried in an httpOnly
 * cookie. They expire after `SESSION_TTL_MS` and are cleared on logout. Because
 * they're in-memory, a server restart logs admins out (acceptable for a single
 * internal box; re-login is cheap).
 */
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Connect } from 'vite';

export const ADMIN_PASSWORD = process.env.DOCX_STUDIO_ADMIN_PASSWORD?.trim() ?? '';
export const ADMIN_COOKIE = 'docx_studio_admin';

const SESSION_TTL_MS =
  Number(process.env.DOCX_STUDIO_ADMIN_TTL_MS ?? 12 * 60 * 60 * 1000) || 12 * 60 * 60 * 1000;

/** sessionId -> expiry epoch ms */
const sessions = new Map<string, number>();

export function adminEnabled(): boolean {
  return Boolean(ADMIN_PASSWORD);
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

export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  return constantTimeEqual(password, ADMIN_PASSWORD);
}

export function createAdminSession(): string {
  const id = randomBytes(32).toString('hex');
  sessions.set(id, Date.now() + SESSION_TTL_MS);
  return id;
}

export function destroyAdminSession(id: string): void {
  sessions.delete(id);
}

function sessionValid(id: string): boolean {
  const exp = sessions.get(id);
  if (!exp) return false;
  if (Date.now() > exp) {
    sessions.delete(id);
    return false;
  }
  return true;
}

export function readAdminCookie(req: Connect.IncomingMessage): string {
  const cookie = (req.headers.cookie ?? '').toString();
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : '';
}

/** True when the request carries a valid, unexpired admin session cookie. */
export function isAdminRequest(req: Connect.IncomingMessage): boolean {
  const id = readAdminCookie(req);
  return Boolean(id) && sessionValid(id);
}

export function adminCookieHeader(id: string, secure: boolean): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${ADMIN_COOKIE}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    secure ? '; Secure' : ''
  }`;
}

export function adminClearCookieHeader(secure: boolean): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

// Opportunistic cleanup of expired sessions.
setInterval(
  () => {
    const now = Date.now();
    for (const [id, exp] of sessions) {
      if (now > exp) sessions.delete(id);
    }
  },
  60 * 60 * 1000,
).unref?.();
