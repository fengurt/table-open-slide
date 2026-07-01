import { useEffect } from 'react';
import './lab-shortcuts.css';

const SHORTCUTS = [
  { keys: '[', desc: 'Toggle global sidebar' },
  { keys: '?', desc: 'Show keyboard shortcuts' },
  { keys: '⌘ K', desc: 'Search HTML files (HTML Lab)' },
  { keys: '← →', desc: 'Prev / next slide (Deck journey)' },
] as const;

export function LabShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="lab-shortcuts-backdrop"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <dialog className="lab-shortcuts-dialog" open aria-labelledby="lab-shortcuts-title">
        <header className="lab-shortcuts-head">
          <h2 id="lab-shortcuts-title">Keyboard shortcuts</h2>
          <button type="button" className="lab-shortcuts-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <ul className="lab-shortcuts-list">
          {SHORTCUTS.map((s) => (
            <li key={s.keys}>
              <kbd>{s.keys}</kbd>
              <span>{s.desc}</span>
            </li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}
