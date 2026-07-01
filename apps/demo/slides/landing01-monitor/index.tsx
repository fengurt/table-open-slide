import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0b1220', text: '#e2e8f0', accent: '#38bdf8' },
  fonts: {
    display: "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    body: "'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace",
  },
  typeScale: { hero: 72, body: 22 },
  radius: 10,
};

type Landing01FilesResponse = {
  root: string;
  count: number;
  truncated?: boolean;
  files: { rel: string; size: number; mtimeMs: number }[];
};

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  padding: '56px 64px',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function previewKind(rel: string): 'iframe' | 'img' | 'none' {
  const lower = rel.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'iframe';
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(lower)) return 'img';
  return 'none';
}

const Monitor = () => {
  const [data, setData] = useState<Landing01FilesResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/landing01-files');
      if (!res.ok) {
        setErr(`${res.status} ${res.statusText}`);
        setData(null);
        return;
      }
      const json = (await res.json()) as Landing01FilesResponse;
      setErr(null);
      setData(json);
      setSelected((prev) => {
        if (prev && json.files.some((f) => f.rel === prev)) return prev;
        return json.files[0]?.rel ?? null;
      });
    } catch (e) {
      setErr(String((e as Error)?.message ?? e));
      setData(null);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    const handler = () => void load();
    hot.on('open-slide:landing01-changed', handler);
    return () => {
      hot.off('open-slide:landing01-changed', handler);
    };
  }, [load]);

  const preview = useMemo(() => {
    if (!selected) return null;
    const q = encodeURIComponent(selected);
    return `/api/landing01-raw?path=${q}`;
  }, [selected]);

  const kind = selected ? previewKind(selected) : 'none';

  return (
    <div style={fill}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: 'linear-gradient(180deg, var(--osd-accent), #818cf8)',
        }}
        aria-hidden="true"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(0, 1.2fr)',
          gap: 40,
          height: '100%',
          alignItems: 'stretch',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            landing01
          </div>
          <div style={{ fontSize: 15, color: 'rgba(226,232,240,0.65)', marginBottom: 20 }}>
            {data
              ? `${data.count} files under dev server · ${data.root}${data.truncated ? ' (list truncated)' : ''}`
              : err
                ? `Error: ${err}`
                : 'Loading…'}
          </div>
          <div
            role="listbox"
            aria-label="landing01 files"
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              borderRadius: 'var(--osd-radius)',
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(15,23,42,0.55)',
            }}
          >
            {(data?.files ?? []).map((f) => {
              const active = f.rel === selected;
              return (
                <button
                  key={f.rel}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelected(f.rel)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                    background: active ? 'rgba(56,189,248,0.12)' : 'transparent',
                    color: 'var(--osd-text)',
                    fontFamily: 'var(--osd-font-body)',
                    fontSize: 14,
                    lineHeight: 1.35,
                    padding: '10px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ wordBreak: 'break-all' }}>{f.rel}</div>
                  <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.45)', marginTop: 4 }}>
                    {formatBytes(f.size)} · {new Date(f.mtimeMs).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div
          style={{
            minHeight: 0,
            borderRadius: 'var(--osd-radius)',
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              padding: '12px 16px',
              fontSize: 13,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(226,232,240,0.5)',
              borderBottom: '1px solid rgba(148,163,184,0.15)',
            }}
          >
            Preview
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {!preview || kind === 'none' ? (
              <div style={{ padding: 24, fontSize: 16, color: 'rgba(226,232,240,0.55)' }}>
                {selected
                  ? 'Select an HTML file or image for inline preview. All paths are listed on the left.'
                  : 'No files yet.'}
              </div>
            ) : null}
            {preview && kind === 'iframe' ? (
              <iframe
                title="landing01 preview"
                src={preview}
                style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              />
            ) : null}
            {preview && kind === 'img' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'auto',
                  display: 'grid',
                  placeItems: 'center',
                  padding: 16,
                }}
              >
                <img
                  src={preview}
                  alt=""
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export const meta: SlideMeta = { title: 'landing01 — file monitor (dev)' };
export default [Monitor] satisfies Page[];
