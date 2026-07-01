import { useState } from 'react';
import { DEFAULT_ADMIN_EMAIL, login } from './auth';
import { UI, type UiLang } from './i18n';
import type { AuthSession } from './types';

export function LoginGate({
  uiLang,
  onSuccess,
}: {
  uiLang: UiLang;
  onSuccess: (session: AuthSession) => void;
}) {
  const t = UI[uiLang];
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onSuccess(await login(email, secret));
    } catch {
      setError(t.invalidLogin);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1 className="login-title">{t.loginTitle}</h1>
        <p className="login-hint">{t.loginHint}</p>
        <p className="login-dev-hint">{t.loginDevHint}</p>
        <form className="login-form" onSubmit={onSubmit}>
          <label className="login-label">
            <span>{t.email}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="login-label">
            <span>{t.secret}</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? t.signingIn : t.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
