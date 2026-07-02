import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  exportDeckPdfUrl,
  exportPdfUrl,
  fetchProject,
  fetchProjectManifest,
  getProject,
  type ProjectModule,
  type ProjectVisualStream,
  previewDeckUrl,
} from '../data/projects';
import './project.css';

export function ProjectJourneyPage() {
  const { projectId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const staticProject = getProject(projectId);
  const [project, setProject] = useState(staticProject);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const requestedSlide = Math.max(1, Number.parseInt(searchParams.get('slide') ?? '1', 10) || 1);
  const requestedAutoplay =
    searchParams.get('autoplay') === '1' || searchParams.get('auto') === '1';
  const delaySeconds = Math.max(
    3,
    Math.min(60, Number.parseInt(searchParams.get('delay') ?? '6', 10) || 6),
  );
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [visualStreams, setVisualStreams] = useState<ProjectVisualStream[]>([]);
  const [slideIndex, setSlideIndex] = useState(requestedSlide - 1);
  const [slideTotal, setSlideTotal] = useState(project?.slideCount ?? 600);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [jumpValue, setJumpValue] = useState(String(requestedSlide));
  const [isAutoPlaying, setIsAutoPlaying] = useState(requestedAutoplay);
  const deckSrc = project ? previewDeckUrl(project.deckPath, requestedSlide) : '';

  useEffect(() => {
    setProject(staticProject);
    if (staticProject || !projectId) return;
    let alive = true;
    fetchProject(projectId)
      .then((next) => {
        if (alive) setProject(next);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [projectId, staticProject]);

  useEffect(() => {
    setSlideIndex(requestedSlide - 1);
    setJumpValue(String(requestedSlide));
  }, [requestedSlide]);

  useEffect(() => {
    setIsAutoPlaying(requestedAutoplay);
  }, [requestedAutoplay]);

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
        setVisualStreams(m.visualStreams ?? []);
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
    if (!isAutoPlaying || slideTotal <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((current) => {
        const next = current >= slideTotal - 1 ? 0 : current + 1;
        setJumpValue(String(next + 1));
        iframeRef.current?.contentWindow?.postMessage({ type: 'atelier-go', index: next }, '*');
        return next;
      });
    }, delaySeconds * 1000);
    return () => window.clearInterval(timer);
  }, [delaySeconds, isAutoPlaying, slideTotal]);

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
  const activeModuleData = modules.find((mod) => mod.id === activeModule);

  return (
    <div className="project-root">
      <header className="project-header">
        <div className="project-brand">
          <span className="project-mark">Atelier</span>
          <div className="project-title-block">
            <span className="project-title">{project.title}</span>
            <span className="project-sub">{project.description}</span>
          </div>
        </div>
        <div className="project-current" aria-live="polite">
          <span>{activeModuleData?.title ?? project.subtitle}</span>
          <strong>
            {slideIndex + 1} / {slideTotal}
          </strong>
        </div>
        <div className="project-actions">
          <button
            className={`project-action project-action--auto${isAutoPlaying ? ' is-active' : ''}`}
            type="button"
            aria-pressed={isAutoPlaying}
            onClick={() => setIsAutoPlaying((playing) => !playing)}
          >
            {isAutoPlaying ? '暂停自动播放' : '自动播放'}
          </button>
          <a
            className="project-action"
            href={project ? exportPdfUrl(project.deckPath, slideIndex + 1) : '#'}
            target="_blank"
            rel="noreferrer"
          >
            导出当前页 PDF
          </a>
          <a
            className="project-action project-action--deck"
            href={project ? exportDeckPdfUrl(project.deckPath) : '#'}
            target="_blank"
            rel="noreferrer"
          >
            导出整套 PDF
          </a>
          <Link
            className="project-action project-action--case"
            to="/project/2day-fb-profit2chain?slide=139"
          >
            餐饮案例
          </Link>
        </div>
        <div className="project-progress">
          <div className="project-progress-track">
            <div className="project-progress-fill" style={{ width: `${progress}%` }} />
          </div>
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
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const n = Number.parseInt(e.currentTarget.value, 10);
              if (Number.isFinite(n)) goSlide(n - 1);
            }}
          />
        </form>
      </header>

      <div className="project-body">
        <aside className="project-modules" aria-label="Project chapters">
          <p className="project-modules-label">{slideTotal} 页 · 模块</p>
          {modules.map((mod) => (
            <button
              key={mod.id}
              type="button"
              className={`project-module${activeModule === mod.id ? ' is-active' : ''}`}
              aria-current={activeModule === mod.id ? 'step' : undefined}
              onClick={() => goSlide(mod.start - 1)}
            >
              <span className="project-module-title">{mod.title}</span>
              <span className="project-module-range">
                {mod.start}–{mod.end}
              </span>
            </button>
          ))}
        </aside>

        {visualStreams.length > 0 ? (
          <aside className="project-streams" aria-label="Case visual streams">
            <p className="project-streams-label">案例视觉流 · 对标门店</p>
            {visualStreams.map((stream) => (
              <button
                key={`${stream.brand}-${stream.start}`}
                type="button"
                className={`project-stream${
                  slideIndex + 1 >= stream.start && slideIndex + 1 <= stream.end ? ' is-active' : ''
                }`}
                aria-current={
                  slideIndex + 1 >= stream.start && slideIndex + 1 <= stream.end
                    ? 'step'
                    : undefined
                }
                onClick={() => goSlide(stream.start - 1)}
              >
                <span className="project-stream-brand">{stream.brand}</span>
                <span className="project-stream-tag">{stream.tag}</span>
                <span className="project-stream-range">
                  {stream.start}–{stream.end}
                </span>
              </button>
            ))}
          </aside>
        ) : null}

        <main className="project-stage">
          <div className="project-frame-shell">
            <iframe ref={iframeRef} title={project.title} src={deckSrc} allow="fullscreen" />
          </div>
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
