import { getStudioToken } from './api';

export type AdminStatus = {
  ok: boolean;
  adminEnabled: boolean;
  isAdmin: boolean;
};

export type AdminLlmProvider = {
  id: string;
  baseUrl: string;
  model: string;
  hasKey: boolean;
  keyHint: string;
};

export type LlmRouterStatus = {
  configured: boolean;
  source?: 'none' | 'env' | 'studio';
  model: string | null;
  baseUrl: string | null;
  providerCount: number;
  providers: Array<{ id: string; baseUrl: string; model: string }>;
};

export type AdminLlmResponse = {
  ok: boolean;
  providers: AdminLlmProvider[];
  status: LlmRouterStatus;
};

/** Provider draft as edited in the UI; blank apiKey means "keep existing". */
export type ProviderDraft = {
  id: string;
  baseUrl: string;
  model: string;
  apiKey: string;
};

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getStudioToken();
  return { ...(extra ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export async function fetchAdminStatus(): Promise<AdminStatus> {
  try {
    const r = await fetch('/api/docx/admin/status');
    if (!r.ok) return { ok: false, adminEnabled: false, isAdmin: false };
    return (await r.json()) as AdminStatus;
  } catch {
    return { ok: false, adminEnabled: false, isAdmin: false };
  }
}

export async function adminLogin(password: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('/api/docx/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return (await r.json()) as { ok: boolean; error?: string };
}

export async function adminLogout(): Promise<void> {
  await fetch('/api/docx/admin/logout', { method: 'POST' });
}

export async function fetchAdminLlm(): Promise<AdminLlmResponse> {
  const r = await fetch('/api/docx/admin/llm', { headers: authHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as AdminLlmResponse;
}

export async function saveAdminLlm(
  providers: ProviderDraft[],
): Promise<{ ok: boolean; providerCount?: number; status?: LlmRouterStatus; error?: string }> {
  const r = await fetch('/api/docx/admin/llm', {
    method: 'PUT',
    headers: authHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({ providers }),
  });
  return (await r.json()) as {
    ok: boolean;
    providerCount?: number;
    status?: LlmRouterStatus;
    error?: string;
  };
}

export async function testAdminLlm(): Promise<{
  ok: boolean;
  provider?: string | null;
  model?: string | null;
  reply?: string;
  error?: string;
}> {
  const r = await fetch('/api/docx/admin/llm/test', {
    method: 'POST',
    headers: authHeaders(),
  });
  return (await r.json()) as {
    ok: boolean;
    provider?: string | null;
    model?: string | null;
    reply?: string;
    error?: string;
  };
}
