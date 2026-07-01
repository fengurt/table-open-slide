import type { HtmlLabController } from '../core/useHtmlLab';
import { VirtualFileList } from './VirtualFileList';

export function FileSidebar({ lab }: { lab: HtmlLabController }) {
  const {
    ui,
    persistUi,
    filter,
    setFilter,
    filtered,
    selected,
    loadErr,
    copyNote,
    listMeta,
    refreshList,
    openSelected,
    setCtxMenu,
    onSidebarDrag,
    watchRoots,
  } = lab;

  if (ui.sidebarCollapsed) {
    return (
      <aside className="hl-sidebar hl-sidebar--collapsed">
        <button
          type="button"
          className="hl-icon-btn"
          onClick={() => persistUi({ sidebarCollapsed: false })}
          title="Expand library"
          aria-label="Expand library"
        >
          ›
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="hl-sidebar" style={{ width: ui.sidebarWidth }}>
        <header className="hl-sidebar-brand">
          <div className="hl-brand-mark" aria-hidden="true" />
          <div>
            <h1 className="hl-sidebar-title">Library</h1>
            <p className="hl-sidebar-sub">HTML files · preview</p>
          </div>
          <button
            type="button"
            className="hl-icon-btn hl-icon-btn--ghost"
            onClick={() => persistUi({ sidebarCollapsed: true })}
            title="Collapse library"
            aria-label="Collapse library"
          >
            ‹
          </button>
        </header>

        <button
          type="button"
          className="hl-search-trigger"
          onClick={() => lab.setSearchOpen(true)}
          aria-label="Search HTML files"
        >
          <span className="hl-search-trigger-label">Search files…</span>
          <kbd className="hl-kbd">⌘K</kbd>
        </button>

        <div className="hl-sidebar-actions">
          <button type="button" className="hl-btn hl-btn--gold" onClick={() => void refreshList()}>
            Refresh Files
          </button>
          {listMeta && (
            <span className="hl-hint hl-hint--inline">
              {listMeta.total} files
              {listMeta.truncated ? ` · first ${lab.items.length}` : ''}
            </span>
          )}
        </div>

        <input
          className="hl-filter-input"
          name="sidebar-file-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter in sidebar…"
          aria-label="Filter file list"
          autoComplete="off"
        />

        <p className="hl-roots-label">
          {watchRoots.map((r) => (
            <code key={r}>{r}/</code>
          ))}
        </p>

        {loadErr && <p className="hl-error">{loadErr}</p>}
        {copyNote && <p className="hl-copy-note">{copyNote}</p>}
        <VirtualFileList
          items={filtered}
          selected={selected}
          onSelect={(p) => void openSelected(p)}
          onContextMenu={(p, x, y) => setCtxMenu({ path: p, x, y })}
        />
      </aside>
      <div className="hl-splitter" onPointerDown={onSidebarDrag} title="Drag to resize" />
    </>
  );
}
