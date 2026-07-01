import { useCallback, useEffect, useRef, useState } from 'react';
import {
  downloadBlob,
  exportFilename,
  exportPagePng,
  PNG_VARIANTS,
  type PngExportVariant,
} from '../core/exportPng';
import type { HtmlLabController } from '../core/useHtmlLab';

export function ExportMenu({ lab }: { lab: HtmlLabController }) {
  const { selected, tuneParams, template } = lab;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<PngExportVariant | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);

  const runExport = useCallback(
    async (variant: PngExportVariant) => {
      if (!selected) return;
      setBusy(variant);
      setNote(null);
      try {
        const blob = await exportPagePng(selected, variant, template ? tuneParams : undefined);
        downloadBlob(blob, exportFilename(selected, variant));
        setNote(`Exported ${variant}`);
        window.setTimeout(() => setNote(null), 2000);
        setOpen(false);
      } catch (e) {
        setNote(String(e instanceof Error ? e.message : e));
      } finally {
        setBusy(null);
      }
    },
    [selected, template, tuneParams],
  );

  if (!selected) return null;

  return (
    <div className="hl-export-wrap" ref={menuRef}>
      <button
        type="button"
        className="hl-btn hl-btn--gold"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Export PNG
      </button>
      {note && <span className="hl-export-note">{note}</span>}
      {open ? (
        <div className="hl-export-menu" role="menu">
          {PNG_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="menuitem"
              className="hl-export-item"
              disabled={busy !== null}
              onClick={() => void runExport(v.id)}
            >
              <span className="hl-export-item-label">{busy === v.id ? 'Exporting…' : v.label}</span>
              <span className="hl-export-item-desc">{v.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
