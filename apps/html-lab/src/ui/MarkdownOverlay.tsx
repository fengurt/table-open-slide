import { memo, useDeferredValue, useEffect, useMemo } from 'react';
import { useDebouncedValue } from '../core/useDebouncedValue';
import { mdToSanitizedFragment } from '../mdLiveHtml';

const MdPreviewPane = memo(function MdPreviewPane({ html }: { html: string }) {
  return (
    <div
      className="hl-md-preview-prose"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify in mdToSanitizedFragment
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export function MarkdownOverlay({
  open,
  md,
  linked,
  htmlDirty,
  syncError,
  saveNote,
  onChange,
  onClose,
  onRegenerate,
  onSaveHtml,
  path,
}: {
  open: boolean;
  md: string;
  linked: boolean;
  htmlDirty: boolean;
  syncError: string | null;
  saveNote: string | null;
  onChange: (value: string) => void;
  onClose: () => void;
  onRegenerate: () => void;
  onSaveHtml: () => void;
  path: string | null;
}) {
  const debouncedMd = useDebouncedValue(md, 100);
  const deferredMd = useDeferredValue(debouncedMd);

  const previewHtml = useMemo(() => {
    try {
      return mdToSanitizedFragment(deferredMd);
    } catch (e) {
      return `<p>${String(e)}</p>`;
    }
  }, [deferredMd]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('hl-md-open');
    return () => document.body.classList.remove('hl-md-open');
  }, [open]);

  if (!open) return null;

  const pending = deferredMd !== md;

  return (
    <div className="hl-md-overlay" role="presentation">
      <button
        type="button"
        className="hl-md-backdrop"
        aria-label="Close markdown editor"
        onClick={onClose}
      />
      <aside className="hl-md-panel" role="dialog" aria-modal="true" aria-label="Markdown editor">
        <header className="hl-md-head">
          <div>
            <h2 className="hl-md-title">Markdown</h2>
            <p className="hl-md-sub">{path ?? 'No file selected'}</p>
            {linked ? (
              <p className="hl-md-linked">
                <span className="hl-md-linked-dot" aria-hidden="true" />
                Linked to HTML preview
                {htmlDirty ? ' · unsaved' : ''}
              </p>
            ) : (
              <p className="hl-md-linked hl-md-linked--off">Generic page — preview only</p>
            )}
          </div>
          <div className="hl-md-actions">
            {pending && <span className="hl-status hl-status--loading">Updating…</span>}
            {syncError && <span className="hl-status hl-status--error">{syncError}</span>}
            {saveNote && <span className="hl-status hl-status--ok">{saveNote}</span>}
            <button type="button" className="hl-btn" onClick={onRegenerate}>
              From HTML
            </button>
            {linked && htmlDirty ? (
              <button type="button" className="hl-btn hl-btn--gold" onClick={onSaveHtml}>
                Save HTML
              </button>
            ) : null}
            <button type="button" className="hl-btn hl-btn--ghost" onClick={onClose} title="Esc">
              ✕
            </button>
          </div>
        </header>
        <div className="hl-md-split-panel">
          <label className="hl-md-editor-wrap">
            <span className="hl-md-pane-label">Source · edits sync to left preview</span>
            <textarea
              className="hl-md-editor"
              value={md}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              aria-label="Markdown source"
            />
          </label>
          <div className="hl-md-preview-wrap">
            <span className="hl-md-pane-label">Rendered preview</span>
            <div className="hl-md-preview-scroll">
              <MdPreviewPane html={previewHtml} />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
