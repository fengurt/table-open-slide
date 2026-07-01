import { useCallback, useEffect, useState } from 'react';
import {
  type AdminLlmProvider,
  type AdminStatus,
  adminLogin,
  adminLogout,
  fetchAdminLlm,
  fetchAdminStatus,
  type LlmRouterStatus,
  type ProviderDraft,
  saveAdminLlm,
  testAdminLlm,
} from '../docx/adminApi';
import { getStudioToken, setStudioToken } from '../docx/api';
import { useLabShell } from '../ui/useLabShell';
import './admin.css';

const PRESETS: Array<{ label: string; baseUrl: string; model: string }> = [
  {
    label: 'Tongyi (Bailian Token Plan)',
    baseUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
    model: 'qwen3.7-max',
  },
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  {
    label: 'Doubao (Volcengine Ark)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: '',
  },
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'n1n.ai', baseUrl: 'https://api.n1n.ai/v1', model: '' },
];

/** UI row = wire draft + a stable local id used only for React keys. */
type Row = ProviderDraft & { uid: string };

function newUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Math.random().toString(36).slice(2)}`;
}

function rowFromProvider(p: AdminLlmProvider): Row {
  return { uid: newUid(), id: p.id, baseUrl: p.baseUrl, model: p.model, apiKey: '' };
}

export function AdminPage() {
  const { showToast } = useLabShell();
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [busy, setBusy] = useState<'idle' | 'login' | 'save' | 'test'>('idle');

  const [providers, setProviders] = useState<Row[]>([]);
  const [keyHints, setKeyHints] = useState<Record<string, string>>({});
  const [routerStatus, setRouterStatus] = useState<LlmRouterStatus | null>(null);
  const [userToken, setUserToken] = useState(getStudioToken());

  const loadLlm = useCallback(() => {
    fetchAdminLlm()
      .then((res) => {
        setProviders(res.providers.map(rowFromProvider));
        setKeyHints(Object.fromEntries(res.providers.map((p) => [p.id, p.keyHint])));
        setRouterStatus(res.status);
      })
      .catch(() => {
        /* not admin yet */
      });
  }, []);

  useEffect(() => {
    fetchAdminStatus().then((s) => {
      setAdminStatus(s);
      if (s.isAdmin) loadLlm();
    });
  }, [loadLlm]);

  const onLogin = useCallback(async () => {
    setBusy('login');
    setLoginError('');
    const res = await adminLogin(password);
    setBusy('idle');
    if (!res.ok) {
      setLoginError(res.error ?? 'login failed');
      return;
    }
    setPassword('');
    const s = await fetchAdminStatus();
    setAdminStatus(s);
    loadLlm();
    showToast('Signed in as admin');
  }, [password, loadLlm, showToast]);

  const onLogout = useCallback(async () => {
    await adminLogout();
    setAdminStatus((s) => (s ? { ...s, isAdmin: false } : s));
    setProviders([]);
    setRouterStatus(null);
    showToast('Signed out');
  }, [showToast]);

  const addProvider = useCallback((preset?: (typeof PRESETS)[number]) => {
    setProviders((curr) => [
      ...curr,
      {
        uid: newUid(),
        id: preset ? preset.label.toLowerCase().split(' ')[0] : `provider-${curr.length + 1}`,
        baseUrl: preset?.baseUrl ?? 'https://api.openai.com/v1',
        model: preset?.model ?? '',
        apiKey: '',
      },
    ]);
  }, []);

  const updateProvider = useCallback((uid: string, patch: Partial<ProviderDraft>) => {
    setProviders((curr) => curr.map((p) => (p.uid === uid ? { ...p, ...patch } : p)));
  }, []);

  const removeProvider = useCallback((uid: string) => {
    setProviders((curr) => curr.filter((p) => p.uid !== uid));
  }, []);

  const onSave = useCallback(async () => {
    setBusy('save');
    const res = await saveAdminLlm(providers.map(({ uid: _uid, ...p }) => p));
    setBusy('idle');
    if (!res.ok) {
      showToast(`Save failed: ${res.error ?? 'unknown'}`);
      return;
    }
    if (res.status) setRouterStatus(res.status);
    showToast(`Saved ${res.providerCount ?? 0} provider(s)`);
    loadLlm();
  }, [providers, showToast, loadLlm]);

  const onTest = useCallback(async () => {
    setBusy('test');
    const res = await testAdminLlm();
    setBusy('idle');
    if (res.ok) {
      showToast(`LLM ok via ${res.provider ?? '?'} (${res.model ?? '?'}) → "${res.reply ?? ''}"`);
    } else {
      showToast(`LLM test failed: ${res.error ?? 'unknown'}`);
    }
  }, [showToast]);

  const saveUserToken = useCallback(() => {
    setStudioToken(userToken.trim());
    showToast(userToken.trim() ? 'Access token saved' : 'Access token cleared');
  }, [userToken, showToast]);

  if (!adminStatus) {
    return <div className="admin-page admin-loading">Loading…</div>;
  }

  if (!adminStatus.adminEnabled) {
    return (
      <div className="admin-page">
        <div className="admin-card admin-disabled">
          <h1>Admin disabled</h1>
          <p>
            No admin password is configured. Set <code>DOCX_STUDIO_ADMIN_PASSWORD</code> in the
            server environment to enable the admin panel and runtime LLM configuration.
          </p>
        </div>
      </div>
    );
  }

  if (!adminStatus.isAdmin) {
    return (
      <div className="admin-page">
        <form
          className="admin-card admin-login"
          onSubmit={(e) => {
            e.preventDefault();
            if (busy === 'idle') onLogin();
          }}
        >
          <h1>Admin sign in</h1>
          <p className="admin-sub">Enter the admin password to manage studio settings.</p>
          <input
            type="password"
            className="admin-input"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // biome-ignore lint/a11y/noAutofocus: dedicated single-field login form
            autoFocus
          />
          {loginError ? <p className="admin-error">{loginError}</p> : null}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy !== 'idle'}>
            {busy === 'login' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Studio admin</h1>
          <p className="admin-sub">Configure the LLM used to tidy raw text/links into Markdown.</p>
        </div>
        <button type="button" className="admin-btn" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>LLM providers</h2>
          {routerStatus ? (
            <span className={`admin-pill ${routerStatus.configured ? 'is-ok' : 'is-off'}`}>
              {routerStatus.configured
                ? `active: ${routerStatus.model ?? '?'} · ${routerStatus.source ?? 'env'}`
                : 'not configured'}
            </span>
          ) : null}
        </div>
        <p className="admin-hint">
          Tried in order; the first that responds wins. Any OpenAI-compatible
          <code>/chat/completions</code> endpoint works. Saved keys are stored on the server and
          never sent back to the browser — leave a key blank to keep the existing one.
        </p>

        {providers.length === 0 ? (
          <p className="admin-empty">No providers yet. Add one below.</p>
        ) : (
          <div className="admin-providers">
            {providers.map((p) => (
              <div className="admin-provider" key={p.uid}>
                <div className="admin-field">
                  <label htmlFor={`id-${p.uid}`}>Name</label>
                  <input
                    id={`id-${p.uid}`}
                    className="admin-input"
                    value={p.id}
                    onChange={(e) => updateProvider(p.uid, { id: e.target.value })}
                  />
                </div>
                <div className="admin-field admin-field-grow">
                  <label htmlFor={`base-${p.uid}`}>Base URL</label>
                  <input
                    id={`base-${p.uid}`}
                    className="admin-input"
                    value={p.baseUrl}
                    placeholder="https://api.deepseek.com/v1"
                    onChange={(e) => updateProvider(p.uid, { baseUrl: e.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor={`model-${p.uid}`}>Model</label>
                  <input
                    id={`model-${p.uid}`}
                    className="admin-input"
                    value={p.model}
                    placeholder="deepseek-chat"
                    onChange={(e) => updateProvider(p.uid, { model: e.target.value })}
                  />
                </div>
                <div className="admin-field admin-field-grow">
                  <label htmlFor={`key-${p.uid}`}>
                    API key{keyHints[p.id] ? ` (stored ${keyHints[p.id]})` : ''}
                  </label>
                  <input
                    id={`key-${p.uid}`}
                    className="admin-input"
                    type="password"
                    value={p.apiKey}
                    placeholder={keyHints[p.id] ? 'leave blank to keep' : 'sk-…'}
                    onChange={(e) => updateProvider(p.uid, { apiKey: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={() => removeProvider(p.uid)}
                  title="Remove provider"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="admin-presets">
          <span>Add:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="admin-chip"
              onClick={() => addProvider(preset)}
            >
              {preset.label}
            </button>
          ))}
          <button type="button" className="admin-chip" onClick={() => addProvider()}>
            Custom
          </button>
        </div>

        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={onSave}
            disabled={busy !== 'idle'}
          >
            {busy === 'save' ? 'Saving…' : 'Save providers'}
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={onTest}
            disabled={busy !== 'idle' || !routerStatus?.configured}
          >
            {busy === 'test' ? 'Testing…' : 'Test connection'}
          </button>
        </div>
      </section>

      <section className="admin-card">
        <h2>Access token (this browser)</h2>
        <p className="admin-hint">
          The shared user token regular users paste to use the studio. Stored locally in this
          browser only.
        </p>
        <div className="admin-token-row">
          <input
            className="admin-input"
            type="password"
            value={userToken}
            placeholder="DOCX_STUDIO_TOKEN"
            onChange={(e) => setUserToken(e.target.value)}
          />
          <button type="button" className="admin-btn" onClick={saveUserToken}>
            Save token
          </button>
        </div>
      </section>
    </div>
  );
}
