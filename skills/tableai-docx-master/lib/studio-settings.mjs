/**
 * Runtime studio settings store (admin-editable, persisted to disk).
 *
 * Lets an admin configure the LLM providers from the web UI instead of only
 * via environment variables. The file lives on the persisted `out/` volume so
 * it survives container restarts and is shared by the web app + MCP server.
 *
 * Shape:
 *   { llm: { providers: [{ id, apiKey, baseUrl, model }] } }
 *
 * Path resolution:
 *   1. DOCX_STUDIO_SETTINGS_FILE (absolute path)
 *   2. <repoRoot>/out/.studio/settings.json
 *
 * Security: this file contains API keys in plaintext. It is intentionally kept
 * under a dotted directory so the `/api/docx/out/*` static server (which blocks
 * dot-segments) will never serve it.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// skills/tableai-docx-master/lib -> repo root is three levels up.
const repoRoot = path.resolve(__dirname, '../../..');

/** @returns {string} absolute path to the settings JSON file */
export function getSettingsFilePath() {
  const override = process.env.DOCX_STUDIO_SETTINGS_FILE?.trim();
  if (override) return path.resolve(override);
  return path.join(repoRoot, 'out', '.studio', 'settings.json');
}

/**
 * @typedef {{ id: string, apiKey: string, baseUrl: string, model: string }} LlmProvider
 * @typedef {{ llm?: { providers?: LlmProvider[] } }} StudioSettings
 */

/** @returns {StudioSettings} parsed settings, or `{}` when absent/unreadable */
export function readStudioSettings() {
  const file = getSettingsFilePath();
  try {
    const raw = readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Atomically persist settings (write temp + rename).
 * @param {StudioSettings} settings
 */
export function writeStudioSettings(settings) {
  const file = getSettingsFilePath();
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(settings, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  renameSync(tmp, file);
}

/**
 * LLM providers configured via the admin UI (settings file). Returns `[]` when
 * none are set, so callers can fall back to environment configuration.
 * @returns {LlmProvider[]}
 */
export function getStudioLlmProviders() {
  const settings = readStudioSettings();
  const providers = settings?.llm?.providers;
  if (!Array.isArray(providers)) return [];
  return providers
    .filter((p) => p && typeof p.apiKey === 'string' && p.apiKey.trim())
    .map((p, i) => ({
      id: String(p.id ?? `studio-${i}`),
      apiKey: String(p.apiKey).trim(),
      baseUrl: String(p.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
      model: String(p.model ?? 'gpt-4o-mini'),
    }));
}
