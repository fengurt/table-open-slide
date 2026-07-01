import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { type GeneratePageResult, generatePage, type PageTheme } from '../core/api';
import { ATELIER_PROJECTS } from '../data/projects';
import { useLabShell } from '../ui/useLabShell';
import { SiteNav } from './HomePage';
import './home.css';

const PAGE_THEMES: Array<{
  id: PageTheme;
  name: string;
  hint: string;
  swatches: string[];
}> = [
  {
    id: 'atelier',
    name: 'Atelier 深空金',
    hint: '企业介绍、发布页、项目简报',
    swatches: ['#0a1626', '#a88b52', '#f7f4ed'],
  },
  {
    id: 'swiss',
    name: 'Swiss 国际主义',
    hint: '产品说明、数据页、工具页',
    swatches: ['#f7f7f2', '#111827', '#245bff'],
  },
  {
    id: 'magazine',
    name: '电子杂志',
    hint: '文章长页、观点页、活动故事',
    swatches: ['#efe4d1', '#281d18', '#c24f2f'],
  },
  {
    id: 'industrial',
    name: '工业蓝图',
    hint: '制造业、工程能力、技术方案',
    swatches: ['#07111f', '#2b6f9f', '#d4a74f'],
  },
];

function PageGenerator() {
  const { showToast } = useLabShell();
  const [theme, setTheme] = useState<PageTheme>('atelier');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GeneratePageResult | null>(null);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    try {
      const next = await generatePage({ title, theme, content });
      setResult(next);
      showToast(`Generated ${next.path}`);
    } catch (e) {
      showToast(`Generate failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [content, theme, title, showToast]);

  const canGenerate = content.trim().length >= 12 && !busy;

  return (
    <section className="page-generator" aria-label="AI page generator">
      <div className="page-generator-copy">
        <span className="sub">Tongyi page generator</span>
        <h2>选择主题，输入内容，直接生成单页 HTML</h2>
        <p>
          使用 Admin 中配置的 OpenAI-compatible LLM。通义 / Qwen 配好以后，这里会直接生成可预览、
          可进入 HTML Lab 编辑的页面。
        </p>
      </div>

      <div className="page-generator-panel">
        <div className="generator-fields">
          <label>
            页面标题
            <input
              value={title}
              placeholder="例如：金豆集团招商介绍页"
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            页面内容
            <textarea
              value={content}
              placeholder="粘贴 brief、产品说明、企业介绍、活动大纲、链接整理后的文本..."
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
        </div>

        <div className="theme-picker" role="radiogroup" aria-label="Page theme">
          {PAGE_THEMES.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`theme-card ${theme === item.id ? 'is-active' : ''}`}
              aria-pressed={theme === item.id}
              onClick={() => setTheme(item.id)}
            >
              <span className="theme-swatches" aria-hidden="true">
                {item.swatches.map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </span>
              <b>{item.name}</b>
              <small>{item.hint}</small>
            </button>
          ))}
        </div>

        <div className="generator-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={!canGenerate}
            onClick={onGenerate}
          >
            {busy ? 'Generating…' : 'Generate page'}
          </button>
          {result ? (
            <>
              <Link className="btn-ghost" to={`/lab?path=${encodeURIComponent(result.path)}`}>
                Open in HTML Lab
              </Link>
              <a className="btn-ghost" href={result.previewUrl} target="_blank" rel="noreferrer">
                Preview
              </a>
            </>
          ) : null}
        </div>

        {result ? (
          <div className="generated-preview">
            <div className="generated-preview-head">
              <span>{result.model ?? result.provider ?? 'LLM'}</span>
              <code>{result.path}</code>
            </div>
            <iframe title="Generated page preview" src={result.previewUrl} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ProjectsPage() {
  return (
    <div className="home">
      <SiteNav />
      <div className="page-head">
        <h1>项目</h1>
        <p>培训 deck 与互动旅程 — 基于 guizang-ppt Atelier 主题生成</p>
      </div>
      <PageGenerator />
      <div className="projects-grid">
        {ATELIER_PROJECTS.map((project) => (
          <Link key={project.id} to={`/project/${project.id}`} className="project-card">
            <span className="sub">{project.subtitle}</span>
            <h2>{project.title}</h2>
            <p>{project.description}</p>
            <div className="project-meta">
              <span>{project.slideCount} slides</span>
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
