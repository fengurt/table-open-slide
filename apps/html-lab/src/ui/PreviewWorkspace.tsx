import type { HtmlLabController } from '../core/useHtmlLab';

export function PreviewWorkspace({ lab }: { lab: HtmlLabController }) {
  const {
    template,
    busy,
    previewSrcDoc,
    previewFrameSrc,
    selected,
    previewIframeRef,
    syncPreviewTune,
    htmlRevision,
  } = lab;

  return (
    <div className="hl-body">
      <div className={`hl-preview-col ${template ? 'hl-preview-col--tunable' : ''}`}>
        <div className="hl-preview-stage">
          {busy && !previewSrcDoc && !previewFrameSrc ? (
            <div className="hl-preview-loading">
              <span className="hl-loader" aria-hidden="true" />
              Loading preview…
            </div>
          ) : (
            <iframe
              ref={previewIframeRef}
              key={`${selected ?? 'none'}:${htmlRevision}`}
              title="html-preview"
              src={previewFrameSrc}
              srcDoc={previewSrcDoc || undefined}
              className="hl-preview-frame"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              onLoad={syncPreviewTune}
            />
          )}
        </div>
      </div>
    </div>
  );
}
