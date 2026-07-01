import type { HtmlLabOptions } from '../core/types';
import { isPreviewOnlyMode, previewPageUrl, readDeepLinkPath } from '../core/urls';
import { useHtmlLab } from '../core/useHtmlLab';
import { TuneOverlay } from '../TuneOverlay';
import { FileSidebar } from './FileSidebar';
import { GlobalSearch } from './GlobalSearch';
import { MarkdownOverlay } from './MarkdownOverlay';
import { PreviewToolbar } from './PreviewToolbar';
import { PreviewWorkspace } from './PreviewWorkspace';

function PreviewOnlyShell({ lab }: { lab: ReturnType<typeof useHtmlLab> }) {
  const deepLinkPath = readDeepLinkPath();
  const { previewSrcDoc } = lab;

  return (
    <div className="hl-embed">
      <header className="hl-embed-bar">
        <span className="hl-embed-path">{deepLinkPath}</span>
        <a className="hl-embed-link" href={`/?path=${encodeURIComponent(deepLinkPath ?? '')}`}>
          Open in Atelier
        </a>
      </header>
      <iframe title="html-preview" srcDoc={previewSrcDoc} className="hl-preview-frame" />
    </div>
  );
}

export function HtmlLabApp({ options }: { options?: HtmlLabOptions }) {
  const lab = useHtmlLab(options);
  const deepLinkPath = readDeepLinkPath();
  const previewOnly = isPreviewOnlyMode();

  if (previewOnly && deepLinkPath) {
    return <PreviewOnlyShell lab={lab} />;
  }

  const {
    ui,
    items,
    searchOpen,
    setSearchOpen,
    openSelected,
    ctxMenu,
    copyPreviewLink,
    template,
    tuneParams,
    setTuneParams,
    savedNote,
    selectedComponent,
    focusedParamDefs,
    focusedModuleStats,
    closeTune,
    resetTune,
    saveTune,
    runAutoLayout,
    autoLayoutBusy,
    mdOpen,
    setMdOpen,
    md,
    setMd,
    regenerateMd,
    selected,
    mdLinked,
    htmlDirty,
    mdSyncError,
    saveNote,
    saveHtml,
  } = lab;

  return (
    <div className="hl-shell">
      <FileSidebar lab={lab} />

      <div className="hl-main">
        <PreviewToolbar lab={lab} />
        <PreviewWorkspace lab={lab} />
      </div>

      <GlobalSearch
        open={searchOpen}
        items={items}
        onClose={() => setSearchOpen(false)}
        onSelect={(path) => void openSelected(path)}
      />

      <MarkdownOverlay
        open={mdOpen}
        md={md}
        linked={mdLinked}
        htmlDirty={htmlDirty}
        syncError={mdSyncError}
        saveNote={saveNote}
        onChange={setMd}
        onClose={() => setMdOpen(false)}
        onRegenerate={regenerateMd}
        onSaveHtml={() => void saveHtml()}
        path={selected}
      />

      {template && ui.tuneOpen ? (
        <TuneOverlay
          template={template}
          width={ui.tuneWidth}
          params={tuneParams}
          paramDefs={selectedComponent ? focusedParamDefs : undefined}
          moduleStats={focusedModuleStats}
          savedNote={savedNote}
          focusLabel={selectedComponent?.label ?? null}
          autoLayoutBusy={autoLayoutBusy}
          onAutoLayout={() => void runAutoLayout()}
          onParamChange={(key, value) => {
            setTuneParams((prev) => ({ ...prev, [key]: value }));
          }}
          onReset={resetTune}
          onSave={saveTune}
          onClose={closeTune}
        />
      ) : null}

      {ctxMenu ? (
        <div
          className="hl-ctx-menu"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button type="button" role="menuitem" onClick={() => void copyPreviewLink(ctxMenu.path)}>
            Copy preview link
          </button>
          <button type="button" role="menuitem" onClick={() => void openSelected(ctxMenu.path)}>
            Open preview
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated use previewPageUrl from core */
export { previewPageUrl };
