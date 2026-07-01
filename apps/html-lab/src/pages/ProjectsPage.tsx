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
  visual: string;
}> = [
  {
    id: 'atelier',
    name: 'Atelier 深空金',
    hint: '企业介绍、发布页、项目简报',
    swatches: ['#0a1626', '#a88b52', '#f7f4ed'],
    visual: 'luxury corporate editorial, deep navy, warm white, champagne gold, refined grid',
  },
  {
    id: 'swiss',
    name: 'Swiss 国际主义',
    hint: '产品说明、数据页、工具页',
    swatches: ['#f7f7f2', '#111827', '#245bff'],
    visual: 'Swiss international style, strict grid, white space, black typography, blue accent',
  },
  {
    id: 'magazine',
    name: '电子杂志',
    hint: '文章长页、观点页、活动故事',
    swatches: ['#efe4d1', '#281d18', '#c24f2f'],
    visual: 'premium digital magazine, warm paper texture, dramatic headline, editorial rhythm',
  },
  {
    id: 'industrial',
    name: '工业蓝图',
    hint: '制造业、工程能力、技术方案',
    swatches: ['#07111f', '#2b6f9f', '#d4a74f'],
    visual:
      'industrial blueprint dashboard, technical grids, steel blue, graphite, capability matrix',
  },
];

function compactContent(input: string): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, 900);
}

function buildNanoBananaPrompt(theme: PageTheme, title: string, content: string): string {
  const selected = PAGE_THEMES.find((item) => item.id === theme) ?? PAGE_THEMES[0];
  const pageTitle = title.trim() || '根据内容提炼一个中文页面标题';
  const summary = compactContent(content);
  return [
    'Create a single high-end website landing page visual mockup as one image.',
    '',
    `Aspect ratio: 16:9 desktop screenshot, 1440px wide composition, no browser chrome.`,
    `Visual direction: ${selected.visual}.`,
    'Audience: business decision makers. Tone: premium, credible, polished, not generic.',
    '',
    'Content constraints:',
    `- Main headline must be in Simplified Chinese: "${pageTitle}".`,
    '- Use only 5 to 8 short Chinese text labels total; avoid long paragraphs.',
    '- Make all visible text large, sharp, and readable.',
    '- Convert dense content into visual sections: hero, metric cards, process/timeline, capability matrix, closing CTA.',
    '- Use realistic UI layout details: navigation, section bands, cards, charts, icons, subtle texture.',
    '- Do not create a poster; make it look like a real scrollable web page captured at the first viewport.',
    '- Do not use fake brand logos unless provided; use abstract marks and geometric symbols.',
    '',
    'Source material to interpret visually:',
    summary || '[paste content here]',
    '',
    'Quality bar:',
    'award-winning web design, production-grade art direction, precise spacing, strong hierarchy, restrained effects, no clutter, no stock-photo look, no unreadable microtext.',
  ].join('\n');
}

function PageGenerator() {
  const { showToast } = useLabShell();
  const [theme, setTheme] = useState<PageTheme>('atelier');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GeneratePageResult | null>(null);
  const [nanoPrompt, setNanoPrompt] = useState('');

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
  const canBuildPrompt = content.trim().length >= 12;

  const onBuildNanoPrompt = useCallback(() => {
    const prompt = buildNanoBananaPrompt(theme, title, content);
    setNanoPrompt(prompt);
    showToast('Nano Banana visual prompt ready');
  }, [content, theme, title, showToast]);

  const onCopyNanoPrompt = useCallback(async () => {
    if (!nanoPrompt) return;
    try {
      await navigator.clipboard.writeText(nanoPrompt);
      showToast('Nano prompt copied');
    } catch {
      showToast('Copy failed');
    }
  }, [nanoPrompt, showToast]);

  return (
    <section className="page-generator" aria-label="AI page generator">
      <div className="page-generator-copy">
        <span className="sub">Tongyi + Nano Banana</span>
        <h2>先出图片式视觉稿，再生成可编辑页面</h2>
        <p>
          通义/Qwen 负责生成单文件 HTML；Nano Banana
          更适合先生成高质量页面图片稿。这里会根据主题和内容产出可复制的视觉稿 prompt。
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
          <button
            type="button"
            className="btn-ghost"
            disabled={!canBuildPrompt}
            onClick={onBuildNanoPrompt}
          >
            Nano visual prompt
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

        {nanoPrompt ? (
          <div className="nano-prompt-card">
            <div className="nano-prompt-head">
              <span>Nano Banana image prompt</span>
              <button type="button" className="btn-ghost" onClick={onCopyNanoPrompt}>
                Copy prompt
              </button>
            </div>
            <textarea
              value={nanoPrompt}
              aria-label="Nano Banana prompt"
              onChange={(e) => setNanoPrompt(e.target.value)}
            />
          </div>
        ) : null}

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
