import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLlmStatus, type LlmStatus, STUDIO_TOKEN_EVENT } from '../docx/api';
import { useLabHealth } from '../lab/LabHealthProvider';
import './lab-status.css';

const STUDIO_ACTIONS = [
  {
    to: '/lab',
    tag: 'HTML',
    title: 'HTML Lab',
    desc: 'Preview & edit landing01/ + slides/ HTML',
  },
  {
    to: '/docx',
    tag: 'Word',
    title: 'docx-master',
    desc: 'Paste → LLM Markdown → branded .docx',
  },
] as const;

export function LabStatusDashboard() {
  const { services, online, loading, scannedAt, refresh } = useLabHealth();
  const [llm, setLlm] = useState<LlmStatus | null>(null);

  const loadLlm = useCallback(() => {
    fetchLlmStatus()
      .then(setLlm)
      .catch(() => setLlm({ configured: false, model: null, baseUrl: null }));
  }, []);

  useEffect(() => {
    loadLlm();
  }, [loadLlm]);

  // Refresh LLM + runtime status when the studio token changes (topbar unlock).
  useEffect(() => {
    const onTokenChange = () => {
      loadLlm();
      void refresh(true);
    };
    window.addEventListener(STUDIO_TOKEN_EVENT, onTokenChange);
    return () => window.removeEventListener(STUDIO_TOKEN_EVENT, onTokenChange);
  }, [loadLlm, refresh]);

  const runtimes = services.filter((s) =>
    ['open-slide-demo', 'kind-viewer', 'taiyuan-storyline'].includes(s.id),
  );

  return (
    <section className="lab-status" aria-label="Studio status">
      <div className="lab-status-row">
        <h2 className="lab-status-heading">Studio</h2>
        <div className="lab-status-cards">
          {STUDIO_ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="lab-status-card">
              <span className="lab-status-card-tag">{a.tag}</span>
              <span className="lab-status-card-title">{a.title}</span>
              <span className="lab-status-card-desc">{a.desc}</span>
              <span className="lab-status-dot is-on" title="Running on :3333" />
            </Link>
          ))}
          <div className="lab-status-card lab-status-card--info">
            <span className="lab-status-card-tag">LLM</span>
            <span className="lab-status-card-title">
              {llm?.configured ? llm.model : 'Not configured'}
            </span>
            <span className="lab-status-card-desc">
              {llm?.configured
                ? 'Format with LLM enabled in docx-master'
                : 'Set OPENAI_API_KEY or DOCX_MASTER_AI_API_KEY'}
            </span>
            <span className={`lab-status-dot${llm?.configured ? ' is-on' : ''}`} />
          </div>
        </div>
      </div>

      <div className="lab-status-row">
        <div className="lab-status-row-head">
          <h2 className="lab-status-heading">Local runtimes</h2>
          <button type="button" className="lab-status-refresh" onClick={() => void refresh(true)}>
            Refresh
          </button>
        </div>
        <ul className="lab-status-list">
          {loading && runtimes.length === 0 ? (
            <li className="lab-status-list-item">Scanning ports…</li>
          ) : (
            runtimes.map((s) => (
              <li key={s.id} className="lab-status-list-item">
                <span className={`lab-status-dot${online.get(s.id) ? ' is-on' : ''}`} />
                <span className="lab-status-list-label">{s.label}</span>
                <span className="lab-status-list-port">:{s.port}</span>
                <span className="lab-status-list-state">
                  {online.get(s.id) ? 'online' : 'offline'}
                </span>
              </li>
            ))
          )}
        </ul>
        {scannedAt ? (
          <p className="lab-status-meta">Last checked {new Date(scannedAt).toLocaleTimeString()}</p>
        ) : null}
      </div>
    </section>
  );
}
