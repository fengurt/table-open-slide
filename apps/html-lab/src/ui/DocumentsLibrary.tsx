import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebouncedValue } from '../core/useDebouncedValue';
import {
  type BrandListItem,
  fetchBrands,
  isLockedError,
  outUrl,
  STUDIO_TOKEN_EVENT,
} from '../docx/api';
import { type DocumentSetMeta, fetchDocumentLibrary } from '../docx/documentLibrary';
import './document-library.css';

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function DocumentCard({ doc }: { doc: DocumentSetMeta }) {
  const thumb = doc.thumbRel ? outUrl(doc.thumbRel) : null;
  return (
    <article className="doc-card">
      <div className="doc-card-thumb">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <span className="doc-card-thumb-fallback">{doc.brandId}</span>
        )}
      </div>
      <div className="doc-card-body">
        <p className="doc-card-brand">{doc.brandId.replace(/-brand$/, '')}</p>
        <h3 className="doc-card-title">{doc.title}</h3>
        {doc.client ? <p className="doc-card-client">{doc.client}</p> : null}
        <p className="doc-card-meta">
          {formatDate(doc.updatedAt)}
          {doc.pageCount ? ` · ${doc.pageCount} pp` : ''}
        </p>
        {doc.tags?.length ? (
          <div className="doc-card-tags">
            {doc.tags.map((t) => (
              <span key={t} className="doc-card-tag">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="doc-card-actions">
          <a className="doc-card-btn primary" href={outUrl(doc.docxRel)} download>
            .docx
          </a>
          {doc.pdfRel ? (
            <a className="doc-card-btn" href={outUrl(doc.pdfRel)} target="_blank" rel="noreferrer">
              PDF
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function DocumentsLibrary() {
  const [docs, setDocs] = useState<DocumentSetMeta[]>([]);
  const [brands, setBrands] = useState<BrandListItem[]>([]);
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 220);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setLocked(false);
    try {
      const sets = await fetchDocumentLibrary({
        q: debouncedQuery || undefined,
        brand: brandFilter || undefined,
      });
      setDocs(sets);
    } catch (e) {
      if (isLockedError(e)) {
        setLocked(true);
      } else {
        setError(String(e instanceof Error ? e.message : e));
      }
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, brandFilter]);

  useEffect(() => {
    fetchBrands()
      .then(setBrands)
      .catch(() => {});
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Re-fetch when the studio token is saved/cleared elsewhere (e.g. the topbar
  // unlock), so the library fills in without a page reload.
  useEffect(() => {
    const onTokenChange = () => void load();
    window.addEventListener(STUDIO_TOKEN_EVENT, onTokenChange);
    return () => window.removeEventListener(STUDIO_TOKEN_EVENT, onTokenChange);
  }, [load]);

  const brandOptions = useMemo(() => {
    const fromDocs = new Set(docs.map((d) => d.brandId));
    for (const b of brands) fromDocs.add(b.id);
    return [...fromDocs].sort();
  }, [docs, brands]);

  return (
    <section className="doc-library" aria-labelledby="doc-library-heading">
      <div className="doc-library-head">
        <div>
          <h2 id="doc-library-heading" className="doc-library-title">
            Document library
          </h2>
          <p className="doc-library-lead">
            Each export lives in <code>out/documents/&lt;slug&gt;/</code> — source markdown, meta,
            Word, PDF, and previews.
          </p>
        </div>
        <Link to="/docx" className="doc-library-new">
          + New document
        </Link>
      </div>

      <div className="doc-library-toolbar">
        <input
          type="search"
          className="doc-library-search"
          placeholder="Search title, client, tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search documents"
        />
        <select
          className="doc-library-filter"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          aria-label="Filter by brand"
        >
          <option value="">All brands</option>
          {brandOptions.map((id) => (
            <option key={id} value={id}>
              {id.replace(/-brand$/, '')}
            </option>
          ))}
        </select>
        <button type="button" className="doc-library-refresh" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {locked ? (
        <div className="doc-library-locked" role="status">
          <span className="doc-library-locked-icon" aria-hidden="true">
            🔒
          </span>
          <div>
            <p className="doc-library-locked-title">Studio locked</p>
            <p className="doc-library-locked-text">
              Add your access token to view saved documents. Use the lock in the top bar, or{' '}
              <Link to="/docx">open docx-master</Link> to paste it.
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="doc-library-error">{error}</p> : null}
      {loading && !locked ? <p className="doc-library-status">Loading…</p> : null}

      {!loading && !locked && docs.length === 0 && !error ? (
        <p className="doc-library-empty">
          No document sets yet. Build from <Link to="/docx">docx-master</Link> or run{' '}
          <code>pnpm docx:from-md:build -- --md … --brand …</code>.
        </p>
      ) : null}

      <div className="doc-library-grid">
        {docs.map((doc) => (
          <DocumentCard key={doc.slug} doc={doc} />
        ))}
      </div>
    </section>
  );
}
