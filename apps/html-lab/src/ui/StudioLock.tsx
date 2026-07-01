import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { fetchAuthStatus, getStudioToken, setStudioToken } from '../docx/api';

/**
 * Global studio access control in the top bar. When the server requires a token
 * (`/api/docx/auth-status` → `required:true`) it lets the user paste it once and
 * unlock every panel app-wide (the library, status, brand pickers all re-fetch
 * via the STUDIO_TOKEN_EVENT). Renders nothing when auth is disabled.
 */
export function StudioLock() {
  const [required, setRequired] = useState(false);
  const [hasToken, setHasToken] = useState(() => Boolean(getStudioToken()));
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  useEffect(() => {
    fetchAuthStatus().then(({ required: req }) => setRequired(req));
    // Re-assert the cookie from any stored token so subresource GETs (img/a) auth.
    const stored = getStudioToken();
    if (stored) setStudioToken(stored);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const save = useCallback(() => {
    const next = value.trim();
    setStudioToken(next);
    setHasToken(Boolean(next));
    setOpen(false);
    setValue('');
  }, [value]);

  const openPopover = useCallback(() => {
    setValue(getStudioToken());
    setOpen((v) => !v);
  }, []);

  if (!required) return null;

  return (
    <div className="studio-lock" ref={popoverRef}>
      <button
        type="button"
        className={`studio-lock-btn${hasToken ? ' is-unlocked' : ' is-locked'}`}
        onClick={openPopover}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={
          hasToken ? 'Studio unlocked — manage access token' : 'Studio locked — add access token'
        }
      >
        <span aria-hidden="true">{hasToken ? '🔓' : '🔒'}</span>
        <span className="studio-lock-label">{hasToken ? 'Unlocked' : 'Locked'}</span>
      </button>

      {open ? (
        <div className="studio-lock-pop" role="dialog" aria-label="Studio access token">
          <label className="studio-lock-pop-label" htmlFor={fieldId}>
            Access token
          </label>
          <input
            ref={inputRef}
            id={fieldId}
            type="password"
            name="studio-access-token"
            className="studio-lock-input"
            value={value}
            placeholder="DOCX_STUDIO_TOKEN…"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
          />
          <div className="studio-lock-pop-actions">
            {hasToken ? (
              <button
                type="button"
                className="studio-lock-clear"
                onClick={() => {
                  setStudioToken('');
                  setHasToken(false);
                  setOpen(false);
                  setValue('');
                }}
              >
                Clear
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="studio-lock-save" onClick={save}>
              Save
            </button>
          </div>
          <p className="studio-lock-hint">
            Stored locally; sent as Bearer + cookie to the studio API.
          </p>
        </div>
      ) : null}
    </div>
  );
}
