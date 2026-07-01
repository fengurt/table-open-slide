/**
 * Multi-provider LLM router — tries providers in priority order for robust formatting.
 *
 * Env (priority order when DOCX_MASTER_AI_PROVIDERS is unset):
 *   1. DOCX_MASTER_AI_*     — primary
 *   2. DOCX_MASTER_AI_FALLBACK_* — secondary gateway (e.g. DeepSeek, n1n)
 *   3. OPENAI_*             — legacy / shared key
 *
 * Or set DOCX_MASTER_AI_PROVIDERS as JSON:
 *   [{"id":"openai","apiKey":"sk-...","baseUrl":"https://api.openai.com/v1","model":"gpt-4o-mini"}, ...]
 *
 * Highest priority: providers configured by an admin via the web UI and
 * persisted to the studio settings file (see studio-settings.mjs). When that
 * file defines providers, it overrides all environment configuration.
 */

import { getStudioLlmProviders } from './studio-settings.mjs';

const DEFAULT_BASE = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * @typedef {{ id: string, apiKey: string, baseUrl: string, model: string }} LlmProvider
 */

/**
 * @param {string} prefix
 * @param {string} id
 * @returns {LlmProvider | null}
 */
function providerFromEnvPrefix(prefix, id) {
  const apiKey = process.env[`${prefix}_API_KEY`]?.trim();
  if (!apiKey) return null;
  const baseUrl = (process.env[`${prefix}_BASE_URL`]?.trim() || DEFAULT_BASE).replace(/\/$/, '');
  const model = process.env[`${prefix}_MODEL`]?.trim() || DEFAULT_MODEL;
  return { id, apiKey, baseUrl, model };
}

/**
 * @returns {LlmProvider[]}
 */
export function listLlmProviders() {
  // Admin-configured providers (settings file) take precedence over env.
  const fromStudio = getStudioLlmProviders();
  if (fromStudio.length > 0) return fromStudio;

  const raw = process.env.DOCX_MASTER_AI_PROVIDERS?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => p?.apiKey)
          .map((p, i) => ({
            id: String(p.id ?? `provider-${i}`),
            apiKey: String(p.apiKey).trim(),
            baseUrl: String(p.baseUrl ?? DEFAULT_BASE).replace(/\/$/, ''),
            model: String(p.model ?? DEFAULT_MODEL),
          }));
      }
    } catch {
      /* fall through to env prefixes */
    }
  }

  /** @type {LlmProvider[]} */
  const chain = [];
  const seen = new Set();
  for (const p of [
    providerFromEnvPrefix('DOCX_MASTER_AI', 'primary'),
    providerFromEnvPrefix('DOCX_MASTER_AI_FALLBACK', 'fallback'),
    providerFromEnvPrefix('OPENAI', 'openai'),
  ]) {
    if (!p || seen.has(p.apiKey)) continue;
    seen.add(p.apiKey);
    chain.push(p);
  }
  return chain;
}

export function llmRouterStatus() {
  const providers = listLlmProviders();
  const primary = providers[0] ?? null;
  const source =
    providers.length === 0 ? 'none' : getStudioLlmProviders().length > 0 ? 'studio' : 'env';
  return {
    configured: providers.length > 0,
    source,
    model: primary?.model ?? null,
    baseUrl: primary?.baseUrl ?? null,
    providerCount: providers.length,
    providers: providers.map(({ id, baseUrl, model }) => ({ id, baseUrl, model })),
  };
}

/**
 * @param {{ messages: Array<{ role: string, content: string }>, temperature?: number }} opts
 */
export async function chatCompletionsWithFallback({ messages, temperature = 0.2 }) {
  const providers = listLlmProviders();
  if (providers.length === 0) {
    return {
      ok: false,
      error:
        'LLM not configured. Set DOCX_MASTER_AI_API_KEY, DOCX_MASTER_AI_FALLBACK_API_KEY, or OPENAI_API_KEY.',
      source: 'none',
    };
  }

  /** @type {string[]} */
  const errors = [];

  for (const provider of providers) {
    try {
      const res = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          temperature,
          messages,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        errors.push(`${provider.id} ${res.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        errors.push(`${provider.id}: empty response`);
        continue;
      }

      return {
        ok: true,
        content,
        source: 'llm',
        model: provider.model,
        provider: provider.id,
        baseUrl: provider.baseUrl,
      };
    } catch (e) {
      errors.push(`${provider.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    ok: false,
    error: `All LLM providers failed: ${errors.join(' | ')}`,
    source: 'llm',
    attempts: errors,
  };
}
