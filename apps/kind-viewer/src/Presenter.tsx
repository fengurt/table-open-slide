import { useCallback, useEffect, useRef, useState } from 'react';
import { isAdmin } from './auth';
import { CommentPanel } from './CommentPanel';
import type { ContentLang } from './contentLang';
import { pickTitle, UI, type UiLang } from './i18n';
import { LayoutEditProvider } from './LayoutEditContext';
import { SlideEditFloat } from './SlideEditFloat';
import { SlideFrame } from './SlideFrame';
import { slidePreviewUrl } from './slideUrl';
import type { AuthSession, SlideManifestEntry } from './types';

export function Presenter({
  slides,
  index,
  contentLang,
  session,
  onIndexChange,
  onContentLangChange,
  onLogout,
  onAdmin,
}: {
  slides: SlideManifestEntry[];
  index: number;
  contentLang: ContentLang;
  session: AuthSession;
  onIndexChange: (i: number) => void;
  onContentLangChange: (lang: ContentLang) => void;
  onLogout: () => void;
  onAdmin: () => void;
}) {
  const uiLang: UiLang = contentLang;
  const t = UI[uiLang];
  const entry = slides[index];
  const rel = entry?.rel ?? '';
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [slideRevision, setSlideRevision] = useState(0);
  const [dockVisible, setDockVisible] = useState(true);
  const layoutEdit = editOpen;
  const slideSrc = rel
    ? slidePreviewUrl(rel, session, contentLang, slideRevision, {
        layoutEdit,
        layoutApply: layoutEdit,
      })
    : '';
  const slideTitle = entry ? pickTitle(entry, contentLang) : '';
  const progress = slides.length > 0 ? ((index + 1) / slides.length) * 100 : 0;

  const onMdSaved = useCallback(() => setSlideRevision((n) => n + 1), []);

  const go = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(slides.length - 1, index + delta));
      if (next !== index) onIndexChange(next);
    },
    [index, onIndexChange, slides.length],
  );

  const toggleFullscreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement === stage) void document.exitFullscreen();
    else void stage.requestFullscreen();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.matches('input, textarea, select') || el?.isContentEditable) return;

      if (e.key === 'Escape') {
        if (editOpen) {
          setEditOpen(false);
          return;
        }
        if (commentsOpen) {
          setCommentsOpen(false);
          return;
        }
        if (document.fullscreenElement) void document.exitFullscreen();
        return;
      }
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if ((e.key === 'e' || e.key === 'E') && !e.metaKey && !e.ctrlKey) {
        setEditOpen((v) => !v);
      }
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        setCommentsOpen((v) => !v);
      }
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commentsOpen, editOpen, go, toggleFullscreen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll rail when slide index changes
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const seg = rail.querySelector('.presenter-rail-seg.is-current');
    seg?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [index]);

  useEffect(() => {
    const showDock = () => setDockVisible(true);
    window.addEventListener('mousemove', showDock);
    return () => window.removeEventListener('mousemove', showDock);
  }, []);

  if (!entry) return null;

  return (
    <div
      className={`presenter ${commentsOpen ? 'presenter--drawer-open' : ''} ${dockVisible ? '' : 'presenter--dock-hidden'} ${layoutEdit ? 'presenter--layout-edit' : ''} ${editOpen ? 'presenter--edit-open' : ''}`}
    >
      <LayoutEditProvider
        slideRel={rel}
        session={session}
        contentLang={contentLang}
        layoutEdit={layoutEdit}
        onSaved={onMdSaved}
        onRequestReload={() => setSlideRevision((n) => n + 1)}
      >
        <div className="presenter-stage" ref={stageRef}>
          {layoutEdit ? (
            <div className="presenter-edit-badge" aria-live="polite">
              {t.layoutEditBadge}
            </div>
          ) : null}
          <SlideFrame
            key={`${rel}-${contentLang}-${slideRevision}-${layoutEdit ? 'edit' : 'view'}`}
            src={slideSrc}
            title={rel}
            className={layoutEdit ? 'slide-frame--edit' : ''}
          />
        </div>
        {editOpen ? (
          <SlideEditFloat
            slideRel={rel}
            session={session}
            uiLang={uiLang}
            contentLang={contentLang}
            onSaved={onMdSaved}
            onClose={() => setEditOpen(false)}
          />
        ) : null}
      </LayoutEditProvider>

      <div className="presenter-dock" role="toolbar" aria-label={t.presenterControls}>
        <div className="presenter-dock-top">
          <div className="presenter-dock-meta">
            <span className="presenter-dock-kicker">{t.slideOf(index + 1, slides.length)}</span>
            <h1 className="presenter-dock-title">{slideTitle}</h1>
          </div>
          <div className="presenter-dock-actions">
            <fieldset className="presenter-lang" aria-label={t.locale}>
              <button
                type="button"
                className={`presenter-lang-btn ${contentLang === 'en' ? 'is-on' : ''}`}
                onClick={() => onContentLangChange('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`presenter-lang-btn ${contentLang === 'zh' ? 'is-on' : ''}`}
                onClick={() => onContentLangChange('zh')}
              >
                中文
              </button>
            </fieldset>
            <button
              type="button"
              className={`presenter-dock-icon ${editOpen ? 'is-on' : ''}`}
              onClick={() => setEditOpen((v) => !v)}
              title={t.editPanel}
            >
              <span aria-hidden>✎</span>
              <span className="presenter-dock-icon-label">{t.editPanel}</span>
            </button>
            <button
              type="button"
              className={`presenter-dock-icon ${commentsOpen ? 'is-on' : ''}`}
              onClick={() => setCommentsOpen((v) => !v)}
              title={t.tabComments}
            >
              <span aria-hidden>💬</span>
              <span className="presenter-dock-icon-label">{t.tabComments}</span>
            </button>
            <button
              type="button"
              className="presenter-dock-icon"
              onClick={toggleFullscreen}
              title={t.fullscreen}
            >
              <span aria-hidden>⛶</span>
            </button>
            {isAdmin(session) ? (
              <button
                type="button"
                className="presenter-dock-icon"
                onClick={onAdmin}
                title={t.admin}
              >
                <span aria-hidden>⚙</span>
              </button>
            ) : null}
            <button
              type="button"
              className="presenter-dock-icon"
              onClick={onLogout}
              title={t.signOut}
            >
              <span aria-hidden>⏻</span>
            </button>
          </div>
        </div>

        <div className="presenter-dock-progress" aria-hidden>
          <div className="presenter-dock-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="presenter-dock-nav">
          <button
            type="button"
            className="presenter-nav-btn"
            onClick={() => go(-1)}
            disabled={index <= 0}
            aria-label={t.prev}
          >
            ←
          </button>

          <div className="presenter-rail" ref={railRef} role="tablist" aria-label={t.slideRail}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${i + 1}. ${pickTitle(s, contentLang)}`}
                className={`presenter-rail-seg ${i === index ? 'is-current' : ''} ${i < index ? 'is-past' : ''}`}
                onClick={() => onIndexChange(i)}
              />
            ))}
          </div>

          <button
            type="button"
            className="presenter-nav-btn"
            onClick={() => go(1)}
            disabled={index >= slides.length - 1}
            aria-label={t.next}
          >
            →
          </button>
        </div>

        <p className="presenter-dock-hint">{t.keysHint}</p>
      </div>

      {commentsOpen ? (
        <button
          type="button"
          className="presenter-backdrop"
          aria-label={t.closeComments}
          onClick={() => setCommentsOpen(false)}
        />
      ) : null}

      <aside className={`presenter-drawer ${commentsOpen ? 'presenter-drawer--open' : ''}`}>
        <div className="presenter-drawer-head">
          <h2>{t.tabComments}</h2>
          <button
            type="button"
            className="presenter-drawer-close"
            onClick={() => setCommentsOpen(false)}
          >
            ×
          </button>
        </div>
        <CommentPanel slideRel={rel} session={session} uiLang={uiLang} />
      </aside>
    </div>
  );
}
