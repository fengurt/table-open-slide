import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchProjectManifest,
  getProject,
  type ProjectModule,
  previewDeckUrl,
} from '../data/projects';
import './project.css';

export function ProjectJourneyPage() {
  const { projectId = '' } = useParams();
  const project = getProject(projectId);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideTotal, setSlideTotal] = useState(project?.slideCount ?? 600);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [jumpValue, setJumpValue] = useState('1');
  const deckSrc = project ? previewDeckUrl(project.deckPath) : '';

  useEffect(() => {
    if (!project || project.slideCount <= 40) return;
    const iframe = iframeRef.current;
    const enableLowPower = () => {
      iframe?.contentWindow?.postMessage({ type: 'atelier-low-power', on: true }, '*');
    };
    iframe?.addEventListener('load', enableLowPower);
    enableLowPower();
    return () => iframe?.removeEventListener('load', enableLowPower);
  }, [project]);

  useEffect(() => {
    if (!project) return;
    fetchProjectManifest(project.manifestPath)
      .then((m) => {
        setModules(m.modules);
        setSlideTotal(m.slideCount);
      })
      .catch(() => {});
  }, [project]);

  const goSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(slideTotal - 1, index));
      setSlideIndex(clamped);
      setJumpValue(String(clamped + 1));
      iframeRef.current?.contentWindow?.postMessage({ type: 'atelier-go', index: clamped }, '*');
    },
    [slideTotal],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'atelier-slide' && typeof e.data.index === 'number') {
        setSlideIndex(e.data.index);
        setJumpValue(String(e.data.index + 1));
        if (typeof e.data.total === 'number') setSlideTotal(e.data.total);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const mod = modules.find((m) => slideIndex + 1 >= m.start && slideIndex + 1 <= m.end);
    if (mod) setActiveModule(mod.id);
  }, [slideIndex, modules]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') goSlide(slideIndex - 1);
      if (e.key === 'ArrowRight') goSlide(slideIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goSlide, slideIndex]);

  if (!project) {
    return (
      <div className="project-root project-root--missing">
        <p className="project-missing">项目未找到 — pick a deck from the sidebar</p>
      </div>
    );
  }

  const progress = slideTotal > 0 ? ((slideIndex + 1) / slideTotal) * 100 : 0;

  return (
    <div className="project-root">
      <header className="project-header">
        <div className="project-brand">
          <span className="project-mark">Atelier</span>
          <span className="project-title">{project.title}</span>
          <span className="project-sub">{project.subtitle}</span>
        </div>
        <div className="project-progress">
          <div className="project-progress-track">
            <div className="project-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="project-progress-label">
            {slideIndex + 1} / {slideTotal}
          </span>
        </div>
        <form
          className="project-jump"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number.parseInt(jumpValue, 10);
            if (Number.isFinite(n)) goSlide(n - 1);
          }}
        >
          <label htmlFor="slide-jump">跳转</label>
          <input
            id="slide-jump"
            type="number"
            name="slide-jump"
            min={1}
            max={slideTotal}
            inputMode="numeric"
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
          />
        </form>
      </header>

      <div className="project-body">
        <aside className="project-modules">
          <p className="project-modules-label">{slideTotal} 页 · 模块</p>
          {modules.map((mod) => (
            <button
              key={mod.id}
              type="button"
              className={`project-module${activeModule === mod.id ? ' is-active' : ''}`}
              onClick={() => goSlide(mod.start - 1)}
            >
              <span className="project-module-title">{mod.title}</span>
              <span className="project-module-range">
                {mod.start}–{mod.end}
              </span>
            </button>
          ))}
        </aside>

        <main className="project-stage">
          <iframe ref={iframeRef} title={project.title} src={deckSrc} allow="fullscreen" />
        </main>
      </div>

      <footer className="project-footer">
        <span>
          ← → 翻页 · ESC 索引 · {slideTotal} 页
          {slideTotal > 40 ? ' · iframe 内按 B 切换动态背景' : ''}
        </span>
        <div className="project-footer-nav">
          <button type="button" disabled={slideIndex <= 0} onClick={() => goSlide(slideIndex - 1)}>
            上一页
          </button>
          <button
            type="button"
            disabled={slideIndex >= slideTotal - 1}
            onClick={() => goSlide(slideIndex + 1)}
          >
            下一页
          </button>
        </div>
      </footer>
    </div>
  );
}
