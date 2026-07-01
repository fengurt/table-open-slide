import { useCallback, useEffect, useState } from 'react';
import { authHeaders } from './auth';
import { UI, type UiLang } from './i18n';
import type { AuthSession, CommentRecord } from './types';

export function CommentPanel({
  slideRel,
  session,
  uiLang,
}: {
  slideRel: string;
  session: AuthSession;
  uiLang: UiLang;
}) {
  const t = UI[uiLang];
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/comments?path=${encodeURIComponent(slideRel)}`, {
        headers: authHeaders(session),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { comments: CommentRecord[] };
      setComments(data.comments);
    } catch (e) {
      setLoadError(String((e as Error)?.message ?? e));
    }
  }, [slideRel, session]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: authHeaders(session),
        body: JSON.stringify({ slideRel, body: text }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setBody('');
      await load();
    } catch {
      setLoadError('post failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="comment-panel" aria-label={t.comments}>
      <h3 className="comment-panel-title">{t.comments}</h3>
      <form className="comment-form" onSubmit={onPost}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.commentPlaceholder}
          rows={3}
          maxLength={4000}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !body.trim()}>
          {busy ? t.posting : t.postComment}
        </button>
      </form>
      {loadError ? <p className="comment-error">{loadError}</p> : null}
      <ul className="comment-list">
        {comments.length === 0 ? (
          <li className="comment-empty">{t.noComments}</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-email">{c.email}</span>
                <time dateTime={new Date(c.createdAt).toISOString()}>
                  {new Date(c.createdAt).toLocaleString(uiLang === 'zh' ? 'zh-CN' : 'en-US')}
                </time>
              </div>
              <p className="comment-body">{c.body}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
