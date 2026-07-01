import type { HtmlLabController } from '../core/useHtmlLab';
import { ExportMenu } from './ExportMenu';

export function PreviewToolbar({ lab }: { lab: HtmlLabController }) {
  const {
    selected,
    busy,
    mdError,
    mtimeNote,
    template,
    ui,
    autoLayoutNote,
    autoLayoutBusy,
    copyPreviewLink,
    closeTune,
    openTuneAll,
    openMarkdown,
    runAutoLayout,
  } = lab;

  return (
    <header className="hl-toolbar">
      <div className="hl-toolbar-path">
        <span className="hl-toolbar-label">Document</span>
        <span className="hl-toolbar-value">{selected ?? 'Select a file'}</span>
      </div>

      <div className="hl-toolbar-status" aria-live="polite">
        {busy && <span className="hl-status hl-status--loading">Loading…</span>}
        {autoLayoutBusy && <span className="hl-status hl-status--loading">Auto-fit…</span>}
        {autoLayoutNote && <span className="hl-status hl-status--ok">{autoLayoutNote}</span>}
        {mdError && <span className="hl-status hl-status--error">{mdError}</span>}
        {mtimeNote && <span className="hl-status hl-status--warn">{mtimeNote}</span>}
      </div>

      {template && <span className="hl-tune-hint">Hover boundaries · click to tune</span>}

      <div className="hl-toolbar-actions">
        <button
          type="button"
          className="hl-btn"
          onClick={() => lab.setSearchOpen(true)}
          aria-label="Search HTML files"
        >
          Search
          <kbd className="hl-kbd hl-kbd--sm">⌘K</kbd>
        </button>
        {template && (
          <>
            <button
              type="button"
              className="hl-btn"
              disabled={autoLayoutBusy}
              onClick={() => void runAutoLayout()}
            >
              {autoLayoutBusy ? 'Auto-fitting…' : 'Auto-Fit Layout'}
            </button>
            <button
              type="button"
              className="hl-btn"
              onClick={() => (ui.tuneOpen ? closeTune() : openTuneAll())}
            >
              {ui.tuneOpen ? 'Close Tune' : 'Tune Layout'}
            </button>
          </>
        )}
        {selected && (
          <>
            <button type="button" className="hl-btn" onClick={openMarkdown}>
              Markdown
            </button>
            <ExportMenu lab={lab} />
            <button type="button" className="hl-btn" onClick={() => void copyPreviewLink(selected)}>
              Copy Link
            </button>
          </>
        )}
      </div>
    </header>
  );
}
