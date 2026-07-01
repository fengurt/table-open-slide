import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authHeaders } from './auth';
import type { ContentLang } from './contentLang';
import type { LayoutBlocks } from './layoutTypes';
import type { MeasuredBlock } from './layoutTypes';
import type { AuthSession } from './types';

type LayoutEditContextValue = {
  ready: boolean;
  snap: boolean;
  setSnap: (v: boolean) => void;
  status: 'idle' | 'loading' | 'saving' | 'saved' | 'optimizing';
  optimizeNote: string | null;
  resetFromSlide: () => void;
  remeasure: () => void;
  runAiOptimize: () => void;
};

const LayoutEditContext = createContext<LayoutEditContextValue | null>(null);

export function useLayoutEdit(): LayoutEditContextValue | null {
  return useContext(LayoutEditContext);
}

function blocksFromMeasured(measured: MeasuredBlock[]): LayoutBlocks {
  const out: LayoutBlocks = {};
  for (const b of measured) {
    out[b.id] = { x: b.x, y: b.y, w: b.w, h: b.h };
  }
  return out;
}

export function LayoutEditProvider({
  slideRel,
  session,
  contentLang,
  layoutEdit,
  onSaved,
  onRequestReload,
  children,
}: {
  slideRel: string;
  session: AuthSession;
  contentLang: ContentLang;
  layoutEdit: boolean;
  onSaved: () => void;
  onRequestReload: () => void;
  children: ReactNode;
}) {
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const labelsRef = useRef<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [snap, setSnap] = useState(true);
  const [status, setStatus] = useState<LayoutEditContextValue['status']>('idle');
  const [optimizeNote, setOptimizeNote] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef('');

  const persist = useCallback(
    (blocks: LayoutBlocks) => {
      const serialized = JSON.stringify(blocks);
      if (serialized === lastSaved.current) return;
      setStatus('saving');
      const q = new URLSearchParams({ path: slideRel, lang: contentLang });
      void fetch(`/api/slide-layout?${q}`, {
        method: 'PUT',
        headers: authHeaders(sessionRef.current),
        body: JSON.stringify({
          blocks,
          labels: labelsRef.current,
          lang: contentLang,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          lastSaved.current = serialized;
          setStatus('saved');
          onSaved();
          window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 800);
        })
        .catch(() => setStatus('idle'));
    },
    [contentLang, onSaved, slideRel],
  );

  const scheduleSave = useCallback(
    (blocks: LayoutBlocks) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(blocks), 350);
    },
    [persist],
  );

  useEffect(() => {
    if (!layoutEdit) {
      setReady(false);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const q = new URLSearchParams({ path: slideRel, lang: contentLang });
    void fetch(`/api/slide-layout?${q}`, { headers: authHeaders(sessionRef.current) })
      .then((res) => res.json())
      .then((data: { labels: Record<string, string> }) => {
        labelsRef.current = data.labels ?? {};
        setReady(true);
        setStatus('idle');
      })
      .catch(() => {
        labelsRef.current = {};
        setReady(true);
        setStatus('idle');
      });
  }, [contentLang, layoutEdit, slideRel]);

  useEffect(() => {
    if (!layoutEdit) return;

    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as {
        type?: string;
        blocks?: MeasuredBlock[];
        blockId?: string;
        html?: string;
        selectedId?: string | null;
      };
      if (data?.type === 'kind-layout-update' && Array.isArray(data.blocks)) {
        for (const b of data.blocks) labelsRef.current[b.id] = b.label;
        const next = blocksFromMeasured(data.blocks);
        if (Object.keys(next).length > 0) {
          setReady(true);
          scheduleSave(next);
        }
        return;
      }
      if (
        data?.type === 'kind-block-text' &&
        data.blockId &&
        typeof data.field === 'string' &&
        data.field.length > 0
      ) {
        if (textSaveTimer.current) clearTimeout(textSaveTimer.current);
        textSaveTimer.current = setTimeout(() => {
          const q = new URLSearchParams({
            path: slideRel,
            lang: contentLang,
            blockId: data.blockId as string,
          });
          void fetch(`/api/slide-block?${q}`, {
            method: 'PUT',
            headers: authHeaders(sessionRef.current),
            body: JSON.stringify({
              field: data.field,
              text: String(data.text ?? ''),
              lang: contentLang,
            }),
          }).then(() => onSaved());
        }, 500);
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (textSaveTimer.current) clearTimeout(textSaveTimer.current);
    };
  }, [contentLang, layoutEdit, onSaved, scheduleSave, slideRel]);

  const resetFromSlide = useCallback(() => {
    const q = new URLSearchParams({ path: slideRel, lang: contentLang });
    void fetch(`/api/slide-layout?${q}`, {
      method: 'PUT',
      headers: authHeaders(sessionRef.current),
      body: JSON.stringify({ blocks: {}, labels: labelsRef.current, lang: contentLang }),
    }).then(() => {
      lastSaved.current = '';
      onRequestReload();
      onSaved();
    });
  }, [contentLang, onRequestReload, onSaved, slideRel]);

  const remeasure = useCallback(() => {
    lastSaved.current = '';
    resetFromSlide();
  }, [resetFromSlide]);

  const runAiOptimize = useCallback(async () => {
    setStatus('optimizing');
    setOptimizeNote(null);
    try {
      const q = new URLSearchParams({ path: slideRel, lang: contentLang });
      const layoutRes = await fetch(`/api/slide-layout?${q}`, {
        headers: authHeaders(sessionRef.current),
      });
      const layoutData = (await layoutRes.json()) as {
        blocks: LayoutBlocks;
        labels: Record<string, string>;
      };
      const res = await fetch(`/api/slide-layout/optimize?${q}`, {
        method: 'POST',
        headers: authHeaders(sessionRef.current),
        body: JSON.stringify({
          blocks: layoutData.blocks,
          labels: layoutData.labels,
          lang: contentLang,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as { blocks: LayoutBlocks; source: 'ai' | 'rules' };
      lastSaved.current = JSON.stringify(data.blocks);
      await fetch(`/api/slide-layout?${q}`, {
        method: 'PUT',
        headers: authHeaders(sessionRef.current),
        body: JSON.stringify({
          blocks: data.blocks,
          labels: layoutData.labels,
          lang: contentLang,
        }),
      });
      setOptimizeNote(data.source);
      onRequestReload();
      onSaved();
      setStatus('saved');
      window.setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1200);
    } catch (e) {
      setOptimizeNote(String((e as Error)?.message ?? e));
      setStatus('idle');
    }
  }, [contentLang, onRequestReload, onSaved, slideRel]);

  const value: LayoutEditContextValue = {
    ready,
    snap,
    setSnap,
    status,
    optimizeNote,
    resetFromSlide,
    remeasure,
    runAiOptimize,
  };

  return <LayoutEditContext.Provider value={value}>{children}</LayoutEditContext.Provider>;
}
