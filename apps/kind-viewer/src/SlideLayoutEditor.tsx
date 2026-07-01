import type { ContentLang } from './contentLang';
import { useLayoutEdit } from './LayoutEditContext';
import { UI, type UiLang } from './i18n';

export function SlideLayoutEditor({
  uiLang,
  contentLang,
}: {
  uiLang: UiLang;
  contentLang: ContentLang;
}) {
  const t = UI[uiLang];
  const ctx = useLayoutEdit();

  if (!ctx) {
    return <p className="slide-md-hint">{t.layoutHintOff}</p>;
  }

  const { ready, status, optimizeNote, resetFromSlide, remeasure, runAiOptimize } = ctx;

  return (
    <section className="slide-layout-panel slide-layout-panel--tools" aria-label={t.tabLayout}>
      <p className="slide-md-hint">{t.layoutHint}</p>
      <div className="slide-layout-toolbar">
        <button
          type="button"
          className="btn btn-sm btn-ai"
          disabled={!ready || status === 'optimizing'}
          onClick={() => void runAiOptimize()}
        >
          {status === 'optimizing' ? t.layoutAiBusy : t.layoutAiOptimize}
        </button>
        <button type="button" className="btn btn-sm" onClick={resetFromSlide}>
          {t.layoutReset}
        </button>
        <button type="button" className="btn btn-sm" disabled={!ready} onClick={remeasure}>
          {t.layoutRemeasure}
        </button>
      </div>
      <p className="slide-layout-status" aria-live="polite">
        {status === 'loading'
          ? t.loading
          : status === 'optimizing'
            ? t.layoutAiBusy
            : status === 'saving'
              ? t.slideSourceSaving
              : status === 'saved'
                ? t.slideSourceSaved
                : (optimizeNote ?? t.layoutKeysHint)}
      </p>
      <p className="slide-md-hint slide-md-hint--sub" lang={contentLang === 'zh' ? 'zh-CN' : 'en'}>
        {t.layoutInlineHelp}
      </p>
    </section>
  );
}
