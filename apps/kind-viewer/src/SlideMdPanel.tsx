import { useCallback, useEffect, useRef, useState } from 'react';
import { authHeaders } from './auth';
import type { ContentLang } from './contentLang';
import { UI, type UiLang } from './i18n';
import type { AuthSession } from './types';

export function SlideMdPanel({
  slideRel,
  session,
  uiLang,
  contentLang,
  onSaved,
}: {
  slideRel: string;
  session: AuthSession;
  uiLang: UiLang;
  contentLang: ContentLang;
  onSaved: () => void;
}) {
  const t = UI[uiLang];
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const [editable, setEditable] = useState('');
  const [relPath, setRelPath] = useState('');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef('');
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setReady(false);
    setLoadError(null);
    try {
      const q = new URLSearchParams({ path: slideRel, lang: contentLang });
      const res = await fetch(`/api/slide-md?${q}`, {
        headers: authHeaders(sessionRef.current),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { editable: string; relPath: string };
      if (seq !== loadSeq.current) return;
      setEditable(data.editable);
      setRelPath(data.relPath);
      lastSaved.current = data.editable;
      setReady(true);
      setStatus('idle');
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setLoadError(String((e as Error)?.message ?? e));
      setStatus('error');
      setReady(true);
    }
  }, [slideRel, contentLang]);

  useEffect(() => {
    void load();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [load]);

  const save = useCallback(
    async (text: string) => {
      if (text === lastSaved.current) return;
      setStatus('saving');
      try {
        const q = new URLSearchParams({ path: slideRel, lang: contentLang });
        const res = await fetch(`/api/slide-md?${q}`, {
          method: 'PUT',
          headers: authHeaders(sessionRef.current),
          body: JSON.stringify({ editable: text, lang: contentLang }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        lastSaved.current = text;
        setStatus('saved');
        onSaved();
        window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1200);
      } catch (e) {
        setLoadError(String((e as Error)?.message ?? e));
        setStatus('error');
      }
    },
    [contentLang, onSaved, slideRel],
  );

  const onChange = (value: string) => {
    setEditable(value);
    setLoadError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void save(value);
    }, 700);
  };

  const langLabel = contentLang === 'zh' ? '中文' : 'EN';

  return (
    <section className="slide-md-panel" aria-label={t.slideSource}>
      <p className="slide-md-hint">{t.slideSourceHint}</p>
      <p className="slide-md-file">
        {t.slideSourceLocale}: <strong>{langLabel}</strong>
        <span className="slide-md-file-sep"> · </span>
        <code>{relPath || '…'}</code>
      </p>
      {loadError ? <p className="slide-md-error">{loadError}</p> : null}
      <textarea
        className="slide-md-editor"
        value={editable}
        readOnly={!ready}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={contentLang === 'zh'}
        lang={contentLang === 'zh' ? 'zh-CN' : 'en'}
      />
      <p className="slide-md-status" aria-live="polite">
        {!ready
          ? t.loading
          : status === 'saving'
            ? t.slideSourceSaving
            : status === 'saved'
              ? t.slideSourceSaved
              : ''}
      </p>
    </section>
  );
}
