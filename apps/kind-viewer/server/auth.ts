import { createHash, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { UserRole } from './db.js';
import { findUserByEmail, verifyUserCredentials } from './users.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  const t = email.trim();
  return t.length >= 3 && t.length <= 254 && EMAIL_RE.test(t);
}

/** Token is bound to email + stored secret hash so rotating secret invalidates sessions. */
export function issueToken(email: string, secretHash: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash('sha256').update(`${normalized}|${secretHash}|kind-viewer-v2`).digest('hex');
}

export function verifyToken(email: string, token: string, secretHash: string): boolean {
  if (!token || !isValidEmail(email)) return false;
  const expected = issueToken(email, secretHash);
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(token, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyLogin(
  email: string,
  secret: string,
): { ok: true; token: string; email: string; role: UserRole } | { ok: false } {
  if (!isValidEmail(email)) return { ok: false };
  const result = verifyUserCredentials(email, secret);
  if ('error' in result) return { ok: false };
  const normalized = result.user.email;
  return {
    ok: true,
    token: issueToken(normalized, result.user.secretHash),
    email: normalized,
    role: result.user.role,
  };
}

export function readAuthFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): { email: string; token: string; role: UserRole } | null {
  const auth = headers.authorization;
  const raw = Array.isArray(auth) ? auth[0] : auth;
  if (!raw?.startsWith('Bearer ')) return null;
  const token = raw.slice(7).trim();
  const emailHeader = headers['x-user-email'];
  const email = (Array.isArray(emailHeader) ? emailHeader[0] : emailHeader)?.trim() ?? '';
  if (!email || !token) return null;

  const user = findUserByEmail(email);
  if (!user) return null;
  if (!verifyToken(email, token, user.secretHash)) return null;
  return { email: user.email, token, role: user.role };
}

/** Headers or `?email=&token=` — needed for iframe slide preview (no custom headers). */
export function readAuthFromRequest(
  req: IncomingMessage,
  searchParams: URLSearchParams,
): { email: string; token: string; role: UserRole } | null {
  const fromHeaders = readAuthFromHeaders(
    req.headers as Record<string, string | string[] | undefined>,
  );
  if (fromHeaders) return fromHeaders;

  const email = searchParams.get('email')?.trim() ?? '';
  const token = searchParams.get('token')?.trim() ?? '';
  if (!email || !token) return null;

  const user = findUserByEmail(email);
  if (!user) return null;
  if (!verifyToken(email, token, user.secretHash)) return null;
  return { email: user.email, token, role: user.role };
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin';
}
