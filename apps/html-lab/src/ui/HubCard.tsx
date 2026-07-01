import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import type { HubEntry } from '../data/hub-catalog';
import { LabShellContext } from './LabShellContext';

function CardBody({ entry }: { entry: HubEntry }) {
  return (
    <>
      <span className="hub-card-tag">{entry.tag}</span>
      <h3 className="hub-card-title">{entry.title}</h3>
      <p className="hub-card-sub">{entry.subtitle}</p>
      <p className="hub-card-desc">{entry.description}</p>
      <span className="hub-card-meta">{entry.meta}</span>
    </>
  );
}

export function HubCard({ entry }: { entry: HubEntry }) {
  const { link } = entry;
  const shell = useContext(LabShellContext);
  const showToast = shell?.showToast;

  if (link.kind === 'route') {
    return (
      <Link to={link.to} className="hub-card">
        <CardBody entry={entry} />
      </Link>
    );
  }

  if (link.kind === 'external') {
    return (
      <a
        href={link.href}
        className="hub-card hub-card-external"
        target="_blank"
        rel="noopener noreferrer"
      >
        <CardBody entry={entry} />
      </a>
    );
  }

  return (
    <button
      type="button"
      className="hub-card hub-card-command"
      title={link.doc ? `Doc: ${link.doc}` : undefined}
      onClick={() => {
        void navigator.clipboard.writeText(link.command).then(() => {
          showToast?.(`Copied: ${link.command}`);
        });
      }}
    >
      <CardBody entry={entry} />
      <span className="hub-card-copy-hint">Click to copy command</span>
    </button>
  );
}

/** Collapsible hub section — mirrors sidebar section defaults. */
export function HubAccordionSection({
  id,
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const storageKey = `hub-section:${id}`;
  const [open, setOpen] = useState(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v != null) return v === '1';
    } catch {
      /* ignore */
    }
    return defaultOpen;
  });

  return (
    <section className={`hub-section${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="hub-section-toggle"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            try {
              localStorage.setItem(storageKey, next ? '1' : '0');
            } catch {
              /* ignore */
            }
            return next;
          });
        }}
      >
        <div className="hub-section-head">
          <h2 className="hub-section-title">{title}</h2>
          {hint ? <p className="hub-section-hint">{hint}</p> : null}
        </div>
        <span className="hub-section-chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? <div className="hub-grid">{children}</div> : null}
    </section>
  );
}
