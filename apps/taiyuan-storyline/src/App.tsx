import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminPortal } from './AdminPortal';
import type { ManifestResponse, SlideManifestEntry } from './types';

type Route = { mode: 'home' } | { mode: 'admin' } | { mode: 'slide'; rel: string };

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw || raw === '/') return { mode: 'home' };
  if (raw === 'admin' || raw === '/admin') return { mode: 'admin' };
  const prefix = '/slide/';
  if (!raw.startsWith(prefix)) return { mode: 'home' };
  const enc = raw.slice(prefix.length);
  try {
    const rel = decodeURIComponent(enc);
    if (!rel || rel.includes('..')) return { mode: 'home' };
    return { mode: 'slide', rel };
  } catch {
    return { mode: 'home' };
  }
}

function setHashHome() {
  window.location.hash = '#/';
}

function setHashSlide(rel: string) {
  window.location.hash = `#/slide/${encodeURIComponent(rel)}`;
}

function formatScannedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

function StorylineStrip({
  slides,
  heading,
  variant,
  onSelect,
}: {
  slides: SlideManifestEntry[];
  heading: string;
  variant: 'a' | 'b';
  onSelect: (rel: string) => void;
}) {
  if (slides.length === 0) return null;
  return (
    <section className={`storyline-strip storyline-strip--${variant}`} aria-label={heading}>
      <div className="storyline-strip-bg" aria-hidden="true" />
      <div className="storyline-strip-head">
        <h2 className="storyline-strip-heading">{heading}</h2>
        <span className="storyline-strip-meta">{slides.length} 页 · 点击节点进入</span>
      </div>
      <ol className="storyline-rail">
        {slides.map((s, i) => (
          <li key={s.rel} className="storyline-segment">
            {i > 0 ? <div className="storyline-wire" aria-hidden="true" /> : null}
            <button
              type="button"
              className="storyline-node"
              onClick={() => onSelect(s.rel)}
              title={s.title}
            >
              <span className="storyline-node-ring" aria-hidden="true" />
              <span className="storyline-node-num">{s.order}</span>
              <span className="storyline-node-title">{s.title}</span>
              <span className="storyline-node-brief">{s.briefing}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function App() {
  const [route, setRoute] = useState(parseHash);
  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scanTick, setScanTick] = useState(0);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (route.mode === 'admin') return;
    void scanTick;
    let cancelled = false;
    (async () => {
      setScanning(true);
      try {
        const res = await fetch(`/api/manifest?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`${res.status} ${res.statusText}`);
        }
        const data = (await res.json()) as ManifestResponse;
        if (!cancelled) {
          setManifest(data);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(String((e as Error)?.message ?? e));
          setManifest(null);
        }
      } finally {
        if (!cancelled) setScanning(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanTick, route.mode]);

  const rescan = () => setScanTick((n) => n + 1);

  const slides = manifest?.slides ?? [];
  const slideByRel = useMemo(() => {
    const m = new Map<string, SlideManifestEntry>();
    for (const s of slides) m.set(s.rel, s);
    return m;
  }, [slides]);

  const allTags = useMemo(() => {
    const t = new Set<string>();
    for (const s of slides) for (const tag of s.tags) t.add(tag);
    return [...t].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [slides]);

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredSlides = useMemo(() => {
    if (!activeTag) return slides;
    return slides.filter((s) => s.tags.includes(activeTag));
  }, [slides, activeTag]);

  const presentationSlides = useMemo(
    () => filteredSlides.filter((s) => s.track === 'presentation'),
    [filteredSlides],
  );
  const reportSlides = useMemo(
    () => filteredSlides.filter((s) => s.track === 'ai_report_2026_slides'),
    [filteredSlides],
  );

  if (route.mode === 'admin') {
    return <AdminPortal />;
  }

  if (route.mode === 'slide') {
    if (loadError) {
      return (
        <div className="app-shell">
          <div className="error-box">
            <p>无法加载幻灯清单：{loadError}</p>
            <p style={{ fontSize: '0.85rem', marginTop: 12 }}>
              请确认路径 <code>event/20260514taiyuan</code> 存在，并已运行 <code>pnpm dev</code>
              （本应用目录）。
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 20 }}
              onClick={rescan}
            >
              重试扫描
            </button>
          </div>
        </div>
      );
    }
    if (!manifest) {
      return (
        <div className="app-shell">
          <div className="loading">载入放映…</div>
        </div>
      );
    }
    const entry = slideByRel.get(route.rel);
    const idx = slides.findIndex((s) => s.rel === route.rel);
    const prev = idx > 0 ? slides[idx - 1] : null;
    const next = idx >= 0 && idx < slides.length - 1 ? slides[idx + 1] : null;
    return (
      <SlideViewer
        rel={route.rel}
        title={entry?.title ?? route.rel}
        trackLabel={entry?.trackLabel}
        onHome={setHashHome}
        onPrev={prev ? () => setHashSlide(prev.rel) : null}
        onNext={next ? () => setHashSlide(next.rel) : null}
      />
    );
  }

  if (loadError) {
    return (
      <div className="app-shell">
        <div className="error-box">
          <p>无法加载幻灯清单：{loadError}</p>
          <p style={{ fontSize: '0.85rem', marginTop: 12 }}>
            请确认路径 <code>event/20260514taiyuan</code> 存在，并已运行 <code>pnpm dev</code>
            （本应用目录）。
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={rescan}
          >
            重试扫描
          </button>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="app-shell">
        <div className="loading">正在扫描文件夹…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-rule" aria-hidden="true" />
          <div>
            <div className="brand-title">太原 · 故事线</div>
            <div className="brand-sub">Closed-door · 2026.05.14</div>
          </div>
        </div>
        <div className="header-actions">
          <button type="button" className="btn" onClick={() => (window.location.hash = '#/admin')}>
            管理台
          </button>
          <span className="header-scan-hint" title="每次请求都会重新读取磁盘上的 HTML">
            已扫 {slides.length} 页
            {manifest.scannedAt ? ` · ${formatScannedAt(manifest.scannedAt)}` : ''}
          </span>
          <button type="button" className="btn" onClick={rescan} disabled={scanning}>
            {scanning ? '扫描中…' : '重新扫描文件夹'}
          </button>
        </div>
      </header>
      <main className="home-main">
        <section className="hero hero--compact">
          <div className="hero-corner" aria-hidden="true" />
          <p className="hero-eyebrow">Storyline map</p>
          <h1>双轨可视故事线</h1>
          <p className="hero-lead">
            下方时间轴按放映顺序串联每一页；卡片区保留检索与简报。点击「重新扫描」会立刻重新遍历{' '}
            <code>event/20260514taiyuan</code> 下的 HTML。
          </p>
        </section>

        <StorylineStrip
          slides={presentationSlides}
          heading="第一轨 · 闭门场主线"
          variant="a"
          onSelect={setHashSlide}
        />
        <StorylineStrip
          slides={reportSlides}
          heading="第二轨 · AI 年报参考线"
          variant="b"
          onSelect={setHashSlide}
        />

        <section className="story-rail" aria-label="叙事双轨概览">
          <div className="story-pillar">
            <h2>闭门场</h2>
            <p>共 {presentationSlides.length} 页（筛选后）。</p>
          </div>
          <div className="story-pillar">
            <h2>AI 年报</h2>
            <p>共 {reportSlides.length} 页（筛选后）。</p>
          </div>
        </section>

        <div className="filter-row">
          <span className="filter-label">标签</span>
          <button
            type="button"
            className={`chip ${activeTag === null ? 'chip-active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip ${activeTag === tag ? 'chip-active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <section aria-label="闭门场幻灯">
          <h2 className="section-title">闭门场 · 卡片</h2>
          <div className="slide-grid" style={{ marginBottom: 40 }}>
            {presentationSlides.map((s) => (
              <SlideCard
                key={s.rel}
                entry={s}
                indexLabel={String(s.order)}
                onOpen={() => setHashSlide(s.rel)}
              />
            ))}
          </div>
        </section>

        <section aria-label="AI 年报幻灯">
          <h2 className="section-title">AI 年报 · 卡片</h2>
          <div className="slide-grid">
            {reportSlides.map((s) => (
              <SlideCard
                key={s.rel}
                entry={s}
                indexLabel={String(s.order)}
                onOpen={() => setHashSlide(s.rel)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SlideCard({
  entry,
  indexLabel,
  onOpen,
}: {
  entry: SlideManifestEntry;
  indexLabel: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="slide-card" onClick={onOpen}>
      <div className="card-index">{indexLabel}</div>
      <div className="card-body">
        <h3 className="card-title">{entry.title}</h3>
        <p className="card-briefing-label">简报</p>
        <p className="card-briefing">{entry.briefing}</p>
      </div>
      <div className="card-tags">
        {entry.tags.map((t) => (
          <span key={t} className="tag-pill">
            {t}
          </span>
        ))}
      </div>
    </button>
  );
}

function SlideViewer({
  rel,
  title,
  trackLabel,
  onHome,
  onPrev,
  onNext,
}: {
  rel: string;
  title: string;
  trackLabel?: string;
  onHome: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageFs, setStageFs] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const src = `/api/slide?path=${encodeURIComponent(rel)}`;

  useEffect(() => {
    const sync = () => {
      setStageFs(document.fullscreenElement === stageRef.current);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleStageFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      /* requestFullscreen unsupported or denied */
    }
  }, []);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t) {
        const n = t.nodeName;
        if (n === 'INPUT' || n === 'TEXTAREA' || n === 'SELECT' || t.isContentEditable) return;
      }
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
          return;
        }
        onHome();
        return;
      }
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'f' || e.key === 'F') {
        if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          void toggleStageFullscreen();
        }
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeys((v) => !v);
      }
    },
    [onHome, onPrev, onNext, toggleStageFullscreen],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  return (
    <div className="viewer">
      <div className="viewer-toolbar">
        <div className="viewer-title-block">
          <p className="viewer-title">{title}</p>
          {trackLabel ? <p className="viewer-meta">{trackLabel}</p> : null}
          <p className="viewer-kbd-hint">
            <kbd>Esc</kbd> 退出全屏 / 首页 · <kbd>F</kbd> 全屏 · <kbd>←</kbd>
            <kbd>→</kbd> 翻页 · <kbd>?</kbd> 帮助
          </p>
        </div>
        <div className="viewer-nav">
          <button type="button" className="btn" onClick={() => (window.location.hash = '#/admin')}>
            管理台
          </button>
          <button type="button" className="btn" onClick={onHome}>
            回首页
          </button>
          <button type="button" className="btn" onClick={() => onPrev?.()} disabled={!onPrev}>
            上一页
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNext?.()}
            disabled={!onNext}
          >
            下一页
          </button>
          <button type="button" className="btn" onClick={() => void toggleStageFullscreen()}>
            {stageFs ? '退出全屏' : '放映区全屏'}
          </button>
        </div>
      </div>
      {showKeys ? (
        <div className="viewer-keys-pop" role="dialog" aria-label="键盘快捷键">
          <button
            type="button"
            className="viewer-keys-close"
            onClick={() => setShowKeys(false)}
            aria-label="关闭"
          >
            ×
          </button>
          <ul className="viewer-keys-list">
            <li>
              <kbd>Esc</kbd> 先退出全屏；若未全屏则返回首页
            </li>
            <li>
              <kbd>F</kbd> 切换「放映区」全屏（仅幻灯画布）
            </li>
            <li>
              <kbd>←</kbd> <kbd>→</kbd> 上一页 / 下一页
            </li>
            <li>
              <kbd>?</kbd> 打开或关闭此说明
            </li>
          </ul>
        </div>
      ) : null}
      <div className="viewer-stage" ref={stageRef}>
        <div className="viewer-frame">
          <iframe title={title} src={src} />
        </div>
      </div>
    </div>
  );
}
