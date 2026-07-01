import type { AuthSession, UserRole } from './types';

const STORAGE_KEY = 'kind-viewer-session';
export const DEFAULT_ADMIN_EMAIL = 'hi@kind4all.ai';

export function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.email || !parsed.token || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function authHeaders(session: AuthSession): HeadersInit {
  return {
    Authorization: `Bearer ${session.token}`,
    'X-User-Email': session.email,
    'Content-Type': 'application/json',
  };
}

export function isAdmin(session: AuthSession): boolean {
  return session.role === 'admin';
}

export async function login(email: string, secret: string): Promise<AuthSession> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, secret }),
  });
  if (!res.ok) throw new Error('Invalid email or secret');
  const data = (await res.json()) as { token: string; email: string; role: UserRole };
  const session: AuthSession = { email: data.email, token: data.token, role: data.role };
  saveSession(session);
  return session;
}

export async function verifySession(session: AuthSession): Promise<AuthSession | null> {
  const res = await fetch('/api/auth/verify', { headers: authHeaders(session) });
  if (!res.ok) return null;
  const data = (await res.json()) as { ok: boolean; email: string; role: UserRole };
  if (!data.ok) return null;
  const next: AuthSession = { email: data.email, token: session.token, role: data.role };
  saveSession(next);
  return next;
}
