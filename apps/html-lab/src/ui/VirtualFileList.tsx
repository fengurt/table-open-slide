import { useCallback, useEffect, useRef, useState } from 'react';
import { formatFileMeta } from '../core/api';
import type { HtmlItem } from '../core/types';

const ROW_HEIGHT = 48;
const OVERSCAN = 6;

export function VirtualFileList({
  items,
  selected,
  onSelect,
  onContextMenu,
}: {
  items: HtmlItem[];
  selected: string | null;
  onSelect: (path: string) => void;
  onContextMenu: (path: string, x: number, y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(480);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    setViewportH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const totalHeight = items.length * ROW_HEIGHT;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportH / ROW_HEIGHT) + OVERSCAN * 2;
  const end = Math.min(items.length, start + visibleCount);
  const slice = items.slice(start, end);
  const offsetY = start * ROW_HEIGHT;

  const onScroll = useCallback(() => {
    setScrollTop(containerRef.current?.scrollTop ?? 0);
  }, []);

  return (
    <div ref={containerRef} className="hl-file-list hl-file-list--virtual" onScroll={onScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {slice.map((it) => (
            <button
              key={it.path}
              type="button"
              style={{ height: ROW_HEIGHT }}
              className={`hl-file-btn ${selected === it.path ? 'is-on' : ''}`}
              onClick={() => onSelect(it.path)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(it.path, e.clientX, e.clientY);
              }}
            >
              <span className="hl-file-path">{it.path}</span>
              <span className="hl-file-meta">{formatFileMeta(it)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
