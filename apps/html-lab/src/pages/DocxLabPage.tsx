import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebouncedValue } from '../core/useDebouncedValue';
import {
  type BrandListItem,
  type BuildResult,
  buildDocx,
  copyText,
  fetchAuthStatus,
  fetchBrands,
  fetchLlmStatus,
  fetchSampleMarkdown,
  formatRawText,
  getStudioToken,
  ingestFile,
  ingestSource,
  type LlmStatus,
  outUrl,
  setStudioToken,
} from '../docx/api';
import { MarkdownPreview } from '../docx/MarkdownPreview';
import { useBrandTheme } from '../docx/useBrandTheme';
import { useLabShell } from '../ui/useLabShell';
import './docx-lab.css';

const SAMPLES = [
  {
    label: 'KiND investor memo (EN)',
    path: 'skills/tableai-docx-master/examples/kind-investor-memo-en.md',
  },
];

type Step = 'paste' | 'markdown' | 'word';

export function DocxLabPage() {
  const { showToast } = useLabShell();
  const [brands, setBrands] = useState<BrandListItem[]>([]);
  const [brandPath, setBrandPath] = useState('modules/tableai-brand/design.md');
  const [raw, setRaw] = useState('');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [hint, setHint] = useState('board memo');
  const [busy, setBusy] = useState<'idle' | 'format' | 'build' | 'ingest'>('idle');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<BuildResult | null>(null);
  const [llm, setLlm] = useState<LlmStatus | null>(null);
  const [step, setStep] = useState<Step>('paste');
  const [authRequired, setAuthRequired] = useState(false);
  const [tokenInput, setTokenInput] = useState(getStudioToken());
  const [dragActive, setDragActive] = useState(false);

  const {
    tokens,
    loading: brandLoading,
    error: brandError,
    style: brandStyle,
  } = useBrandTheme(brandPath);
  const previewMarkdown = useDebouncedValue(markdown, 180);

  const loadServerStatus = useCallback(() => {
    fetchBrands()
      .then(setBrands)
      .catch(() => setStatus('Could not load brand packs — check access token'));
    fetchLlmStatus()
      .then(setLlm)
      .catch(() => setLlm({ configured: false, model: null, baseUrl: null, source: 'none' }));
  }, []);

  useEffect(() => {
    // Refresh the auth cookie from any token persisted in a previous session so
    // <img>/<a> subresource GETs authenticate on first load.
    const stored = getStudioToken();
    if (stored) setStudioToken(stored);
    fetchAuthStatus().then(({ required }) => setAuthRequired(required));
    loadServerStatus();
  }, [loadServerStatus]);

  const saveToken = useCallback(() => {
    setStudioToken(tokenInput.trim());
    setStatus(tokenInput.trim() ? 'Access token saved' : 'Access token cleared');
    loadServerStatus();
  }, [tokenInput, loadServerStatus]);

  const formatWithLlm = useCallback(async () => {
    if (!raw.trim()) {
      setStatus('Paste content first');
      setStep('paste');
      return;
    }
    setBusy('format');
    setStatus('LLM formatting → Markdown…');
    try {
      const data = await formatRawText({ raw, brand: brandPath, hint: hint || undefined });
      if (!data.ok || !data.markdown) {
        setStatus(data.error ?? 'Format failed');
        return;
      }
      setMarkdown(data.markdown);
      setStep('markdown');
      setStatus(`Formatted (${data.model ?? 'llm'}) — review then Build`);
    } catch (e) {
      setStatus(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy('idle');
    }
  }, [raw, brandPath, hint]);

  const build = useCallback(async () => {
    const src = markdown.trim() || raw.trim();
    if (!src) {
      setStatus('Paste or format content first');
      return;
    }
    setBusy('build');
    setStatus('Generate → validate → preview…');
    setResult(null);
    try {
      const data = await buildDocx({
        markdown: markdown.trim() || raw,
        brand: brandPath,
        pages: 24,
        documentSet: true,
      });
      if (!data.ok) {
        setStatus(data.error ?? 'Build failed');
        setResult(data);
        return;
      }
      setResult(data);
      setStep('word');
      setStatus(`Word ready — ${data.title ?? data.filename}`);
    } catch (e) {
      setStatus(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy('idle');
    }
  }, [markdown, raw, brandPath]);

  const formatAndBuildAll = useCallback(async () => {
    if (!raw.trim() && !markdown.trim()) {
      setStatus('Paste content first');
      setStep('paste');
      return;
    }
    let md = markdown;
    if (raw.trim() && llm?.configured) {
      setBusy('format');
      setStatus('Formatting…');
      const data = await formatRawText({ raw, brand: brandPath, hint: hint || undefined });
      if (!data.ok || !data.markdown) {
        setStatus(data.error ?? 'Format failed');
        setBusy('idle');
        return;
      }
      md = data.markdown;
      setMarkdown(md);
    } else if (!md.trim()) {
      md = raw;
    }
    setBusy('build');
    setStatus('Building Word…');
    try {
      const data = await buildDocx({ markdown: md, brand: brandPath, pages: 12 });
      if (!data.ok) {
        setStatus(data.error ?? 'Build failed');
        setResult(data);
        return;
      }
      setResult(data);
      setStep('word');
      setStatus(`Done — ${data.title ?? data.filename}`);
    } catch (e) {
      setStatus(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy('idle');
    }
  }, [raw, markdown, brandPath, hint, llm?.configured]);

  // ⌘/Ctrl+Enter from anywhere runs the primary "Format & Build" action.
  // A ref keeps the listener stable so we don't re-subscribe on every keystroke.
  const buildAllRef = useRef(formatAndBuildAll);
  buildAllRef.current = formatAndBuildAll;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void buildAllRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loadSample = useCallback(async (path: string) => {
    setStatus('Loading sample…');
    try {
      const text = await fetchSampleMarkdown(path);
      setMarkdown(text);
      setRaw('');
      setStep('markdown');
      setStatus('Sample loaded into Markdown');
    } catch (e) {
      setStatus(String(e instanceof Error ? e.message : e));
    }
  }, []);

  const ingestLink = useCallback(async () => {
    if (!url.trim()) {
      setStatus('Paste a link first');
      return;
    }
    setBusy('ingest');
    setStatus(`Fetching ${url.trim()}…`);
    try {
      const data = await ingestSource({ url: url.trim() });
      if (!data.ok || !data.markdown) {
        setStatus(data.error ?? 'Could not extract link');
        return;
      }
      setMarkdown(data.markdown);
      setStep('markdown');
      setStatus(`Extracted ${data.chars?.toLocaleString() ?? ''} chars — review then Build`);
    } catch (e) {
      setStatus(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy('idle');
    }
  }, [url]);

  const ingestUpload = useCallback(async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    setBusy('ingest');
    setStatus(`Extracting ${file.name}…`);
    try {
      const data = await ingestFile(file);
      if (!data.ok || !data.markdown) {
        setStatus(data.error ?? 'Could not extract document');
        return;
      }
      setMarkdown(data.markdown);
      setStep('markdown');
      setStatus(`Extracted ${data.chars?.toLocaleString() ?? ''} chars — review then Build`);
    } catch (e) {
      setStatus(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy('idle');
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0] ?? null;
      if (file) void ingestUpload(file);
    },
    [ingestUpload],
  );

  // Prefer the build's real relative paths (handles document-set subfolders);
  // fall back to flat filenames for older results.
  const docxHref = result?.docxRel
    ? outUrl(result.docxRel)
    : result?.filename
      ? outUrl(`${result.filename}.docx`)
      : null;
  const pdfHref = result?.preview?.pdfRel
    ? outUrl(result.preview.pdfRel)
    : result?.filename
      ? outUrl(`${result.filename}.pdf`)
      : null;
  const isBusy = busy !== 'idle';
  const charCount = (step === 'paste' ? raw : markdown).length;

  return (
    <div className={`dl-page${isBusy ? ' is-busy' : ''}`}>
      <div className="dl-workflow-bar" role="tablist" aria-label="docx workflow">
        <button
          type="button"
          className={`dl-step${step === 'paste' ? ' is-active' : ''}`}
          onClick={() => setStep('paste')}
        >
          1 · Paste
        </button>
        <button
          type="button"
          className={`dl-step${step === 'markdown' ? ' is-active' : ''}`}
          onClick={() => setStep('markdown')}
        >
          2 · Markdown
        </button>
        <button
          type="button"
          className={`dl-step${step === 'word' ? ' is-active' : ''}`}
          onClick={() => setStep('word')}
        >
          3 · Word preview
        </button>
        <Link
          to="/admin"
          className={`dl-llm-badge${llm?.configured ? ' is-on' : ''}`}
          title={
            llm?.configured
              ? `Active model: ${llm.model}${llm.source ? ` (via ${llm.source})` : ''} — manage in Admin`
              : 'No LLM configured — click to set up API keys in Admin'
          }
        >
          {llm?.configured
            ? `LLM · ${llm.model}${llm.source === 'studio' ? ' · admin' : ''}`
            : 'LLM offline — configure →'}
        </Link>
      </div>

      <div className="dl-shell">
        <aside className="dl-sidebar">
          <div className="dl-sidebar-head">
            <p className="dl-eyebrow">Brand &amp; actions</p>
          </div>

          {authRequired ? (
            <div className="dl-field">
              <span className="dl-label">Access token</span>
              <div className="dl-import-row" style={{ padding: 0, border: 0 }}>
                <input
                  className="dl-input"
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="shared studio token"
                  style={{ flex: 1, minWidth: 120 }}
                />
                <button type="button" className="dl-btn-secondary" onClick={saveToken}>
                  Save
                </button>
              </div>
            </div>
          ) : null}

          <div className="dl-field">
            <span className="dl-label">Brand pack</span>
            <select
              className="dl-select"
              value={brandPath}
              onChange={(e) => setBrandPath(e.target.value)}
            >
              {brands.length === 0 ? (
                <option value={brandPath}>
                  {brandPath.split('/').slice(-2, -1)[0] ?? brandPath}
                </option>
              ) : (
                brands.map((b) => (
                  <option key={b.id} value={b.path}>
                    {b.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="dl-field">
            <span className="dl-label">Format hint (optional)</span>
            <input
              className="dl-input"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="board memo, investor deck…"
            />
          </div>

          {tokens ? (
            <div className="dl-brand-card" style={brandStyle}>
              <p className="dl-brand-name">{tokens.name}</p>
              <div className="dl-swatches">
                <span title="accent" style={{ background: `var(--dl-accent)` }} />
                <span title="ink" style={{ background: `var(--dl-ink)` }} />
                <span title="muted" style={{ background: `var(--dl-muted)` }} />
                <span title="paper" style={{ background: `var(--dl-paper)` }} />
              </div>
              {tokens.headerText ? <p className="dl-chrome-preview">{tokens.headerText}</p> : null}
            </div>
          ) : brandLoading ? (
            <p className="dl-muted-line">Loading brand…</p>
          ) : brandError ? (
            <p className="dl-error-line">{brandError}</p>
          ) : null}

          <div className="dl-actions">
            <button
              type="button"
              className="dl-btn-secondary"
              disabled={isBusy || !llm?.configured}
              onClick={() => void formatWithLlm()}
            >
              {busy === 'format' ? 'Formatting…' : 'Format with LLM'}
            </button>
            <button
              type="button"
              className="dl-btn-primary"
              disabled={isBusy}
              onClick={() => void formatAndBuildAll()}
            >
              {busy !== 'idle' ? 'Working…' : 'Format & Build'}
            </button>
            <button type="button" className="dl-btn-secondary" disabled={isBusy} onClick={build}>
              Build only
            </button>
          </div>

          <div className="dl-samples">
            <span className="dl-label">Samples</span>
            {SAMPLES.map((s) => (
              <button
                key={s.path}
                type="button"
                className="dl-btn-ghost"
                onClick={() => void loadSample(s.path)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className={`dl-status${result?.error ? ' is-error' : ''}`} aria-live="polite">
            {status}
          </p>

          <footer className="dl-foot">
            MCP: <code>docx_format_and_build</code>
            <br />
            GUI: paste → format → build
          </footer>
        </aside>

        <div className="dl-workspace">
          {(step === 'paste' || step === 'markdown') && (
            // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop is a progressive enhancement; the accessible "Upload" file input below provides the keyboard path
            <div
              className={`dl-pane${step === 'paste' ? ' is-visible' : ''}${dragActive ? ' is-drag' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!dragActive) setDragActive(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setDragActive(false);
              }}
              onDrop={onDrop}
            >
              <div className="dl-pane-bar">
                <span className="dl-editor-label">Paste raw text</span>
                <span className="dl-editor-hint">
                  {charCount > 0 ? `${charCount.toLocaleString()} chars · ` : ''}
                  Drop a file, import a link, or paste — then ⌘/Ctrl+Enter
                </span>
              </div>
              <div className="dl-import-row">
                <input
                  className="dl-input dl-import-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article — import a link"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="dl-btn-secondary"
                  disabled={isBusy || !url.trim()}
                  onClick={() => void ingestLink()}
                >
                  {busy === 'ingest' ? 'Importing…' : 'Import link'}
                </button>
                <label className="dl-btn-ghost dl-upload-label">
                  {fileName ? `↑ ${fileName}` : 'Upload PDF / DOCX / MD'}
                  <input
                    type="file"
                    className="dl-upload-input"
                    accept=".pdf,.docx,.md,.markdown,.txt"
                    onChange={(e) => {
                      void ingestUpload(e.target.files?.[0] ?? null);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <textarea
                className="dl-editor"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="Paste unformatted content here…"
                spellCheck={false}
              />
            </div>
          )}

          {(step === 'markdown' || step === 'word') && (
            <div className={`dl-pane dl-pane--split${step === 'markdown' ? ' is-visible' : ''}`}>
              <div className="dl-pane-col">
                <div className="dl-pane-bar">
                  <span className="dl-editor-label">Markdown</span>
                  <button
                    type="button"
                    className="dl-copy-btn"
                    disabled={!markdown}
                    onClick={() => void copyText(markdown).then(() => showToast('Markdown copied'))}
                  >
                    Copy
                  </button>
                </div>
                <textarea
                  className="dl-editor"
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder="Formatted Markdown appears here…"
                  spellCheck={false}
                />
              </div>
              <div className="dl-pane-col dl-pane-col--preview" style={brandStyle}>
                <div className="dl-pane-bar">
                  <span className="dl-editor-label">MD preview</span>
                </div>
                <MarkdownPreview source={previewMarkdown} brandStyle={brandStyle} />
              </div>
            </div>
          )}

          {step === 'word' && (
            <div className="dl-pane dl-pane--word is-visible" style={brandStyle}>
              <div className="dl-preview-bar">
                <span className="dl-preview-label">Word preview</span>
                {tokens ? <span className="dl-preview-brand">{tokens.name}</span> : null}
                {result?.validated ? (
                  <span className={`dl-valid-badge${result.validated.ok ? ' is-ok' : ' is-error'}`}>
                    {result.validated.ok ? 'OOXML valid' : 'Validation failed'}
                  </span>
                ) : null}
              </div>

              {docxHref ? (
                <div className="dl-downloads">
                  <a href={docxHref} download className="dl-dl-btn">
                    Download .docx
                  </a>
                  {pdfHref ? (
                    <a href={pdfHref} target="_blank" rel="noreferrer" className="dl-dl-btn">
                      Open PDF
                    </a>
                  ) : null}
                </div>
              ) : null}

              {result?.preview?.pages?.length ? (
                <div className="dl-preview-grid">
                  {result.preview.pages.map((p) => (
                    <figure key={p.name} className="dl-preview-frame">
                      <img src={outUrl(p.rel)} alt={p.name} />
                      <figcaption>{p.name.replace('page-', 'p.')}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="dl-preview-empty">
                  <p>Run Build .docx to see page renders.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isBusy ? (
        <div className="dl-busy-overlay" aria-hidden="true">
          <span className="dl-busy-spinner" />
        </div>
      ) : null}
    </div>
  );
}
