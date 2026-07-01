import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from './auth';
import { UI, type UiLang } from './i18n';
import type { AuthSession, PublicUser, UserRole } from './types';

export function AdminPortal({
  session,
  uiLang,
  onBack,
}: {
  session: AuthSession;
  uiLang: UiLang;
  onBack: () => void;
}) {
  const t = UI[uiLang];
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders(session) });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { users: PublicUser[] };
      setUsers(data.users);
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: authHeaders(session),
        body: JSON.stringify({ email: newEmail, secret: newSecret, role: newRole }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `${res.status}`);
      }
      setNewEmail('');
      setNewSecret('');
      setNewRole('viewer');
      await load();
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (email: string) => {
    if (!window.confirm(t.adminDeleteConfirm(email))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: authHeaders(session),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      await load();
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    } finally {
      setBusy(false);
    }
  };

  const onResetSecret = async (email: string) => {
    const secret = window.prompt(t.adminResetPrompt(email));
    if (!secret?.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: authHeaders(session),
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      await load();
    } catch (err) {
      setError(String((err as Error)?.message ?? err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">{t.adminTitle}</h1>
          <p className="admin-sub">{t.adminSub}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          {t.adminBack}
        </button>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <section className="admin-card">
        <h2>{t.adminAddUser}</h2>
        <form className="admin-form" onSubmit={onAdd}>
          <label className="admin-label">
            <span>{t.email}</span>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </label>
          <label className="admin-label">
            <span>{t.secret}</span>
            <input
              type="password"
              required
              minLength={4}
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
            />
          </label>
          <label className="admin-label">
            <span>{t.adminRole}</span>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)}>
              <option value="viewer">{t.adminRoleViewer}</option>
              <option value="admin">{t.adminRoleAdmin}</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? t.adminSaving : t.adminAdd}
          </button>
        </form>
      </section>

      <section className="admin-card admin-card--wide">
        <h2>{t.adminUserList}</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t.email}</th>
              <th>{t.adminRole}</th>
              <th>{t.adminActions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td>
                  <code>{u.email}</code>
                  {u.email === 'hi@kind4all.ai' ? (
                    <span className="admin-badge">{t.adminDefaultBadge}</span>
                  ) : null}
                </td>
                <td>{u.role === 'admin' ? t.adminRoleAdmin : t.adminRoleViewer}</td>
                <td className="admin-actions">
                  <button type="button" className="btn" onClick={() => void onResetSecret(u.email)}>
                    {t.adminResetSecret}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => void onDelete(u.email)}
                    disabled={u.email === session.email}
                  >
                    {t.adminDelete}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
