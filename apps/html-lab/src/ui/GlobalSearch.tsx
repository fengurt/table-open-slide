import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { basename, formatFileMeta } from '../core/api';
import { recentItems, searchHtmlItems } from '../core/search';
import type { HtmlItem } from '../core/types';

export function GlobalSearch({
  open,
  items,
  onClose,
  onSelect,
}: {
  open: boolean;
  items: HtmlItem[];
  onClose: () => void;
  onSelect: (path: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) {
      const recents = recentItems(items, 6);
      const rest = items.filter((i) => !recents.some((r) => r.path === i.path)).slice(0, 12);
      return [...recents, ...rest].slice(0, 18);
    }
    return searchHtmlItems(items, query, 24);
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const pick = useCallback(
    (path: string) => {
      onSelect(path);
      onClose();
    },
    [onSelect, onClose],
  );

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      pick(results[activeIndex].path);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const trimmedQuery = query.trim();
  const showRecentsHeader = !trimmedQuery && recentItems(items, 1).length > 0;
  const resultLabel = trimmedQuery
    ? `${results.length} match${results.length === 1 ? '' : 'es'}`
    : `${results.length} quick picks`;

  return (
    <div className="hl-search-overlay">
      <button
        type="button"
        className="hl-search-backdrop"
        aria-label="Close search"
        onClick={onClose}
      />
      <div
        className="hl-search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search HTML files"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="hl-search-input-wrap">
          <span className="hl-search-icon" aria-hidden="true">
            ◇
          </span>
          <input
            ref={inputRef}
            className="hl-search-input"
            name="html-lab-global-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search landing01 / slides…"
            aria-label="Search HTML files"
            spellCheck={false}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="hl-search-clear"
              aria-label="Clear search"
              onClick={() => {
                setQuery('');
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          )}
          <kbd className="hl-kbd">esc</kbd>
        </div>

        <div className="hl-search-section-row">
          <p className="hl-search-section-label">{showRecentsHeader ? 'Recent' : 'Files'}</p>
          <p className="hl-search-count" aria-live="polite">
            {resultLabel}
          </p>
        </div>

        <div className="hl-search-results" ref={listRef}>
          {results.length === 0 ? (
            <p className="hl-search-empty">No matches</p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.path}
                type="button"
                data-index={index}
                className={`hl-search-item ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => pick(item.path)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className="hl-search-item-name">{basename(item.path)}</span>
                <span className="hl-search-item-path">{item.path}</span>
                <span className="hl-search-item-meta">{formatFileMeta(item)}</span>
              </button>
            ))
          )}
        </div>

        <footer className="hl-search-footer">
          <span>
            <kbd className="hl-kbd">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="hl-kbd">↵</kbd> open
          </span>
          <span>
            <kbd className="hl-kbd">⌘K</kbd> toggle
          </span>
        </footer>
      </div>
    </div>
  );
}
