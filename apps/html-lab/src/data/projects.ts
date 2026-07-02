export type ProjectModule = {
  id: string;
  title: string;
  start: number;
  end: number;
};

export type ProjectVisualStream = {
  brand: string;
  tag: string;
  module: string;
  start: number;
  end: number;
  beats: string[];
};

export type AtelierProject = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  slideCount: number;
  manifestPath: string;
  deckPath: string;
  tags: string[];
};

export const ATELIER_PROJECTS: AtelierProject[] = [
  {
    id: 'guizang-atelier-demo',
    title: 'guizang · Atelier Showcase',
    subtitle: 'Style C · 12 layouts',
    description:
      'guizang-ppt-skill 深空金主题演示：Stat / Quote / Case / Flash 等 12 种版式一页一型',
    slideCount: 12,
    manifestPath: 'skills/tableai-guizang-ppt-skill/demo/atelier-showcase/manifest.json',
    deckPath: 'skills/tableai-guizang-ppt-skill/demo/atelier-showcase/index.html',
    tags: ['guizang', 'demo', '12p', 'Atelier'],
  },
  {
    id: 'jindou-corporate',
    title: '金豆投资控股集团 · 企业形象',
    subtitle: 'Corporate Profile · 24-page executive deck',
    description: '基于金豆投资控股集团 PPT 设计任务书重制 — 24 页深蓝藏青 + 香槟金企业形象 deck',
    slideCount: 24,
    manifestPath: 'slides/projects/jindou-corporate/manifest.json',
    deckPath: 'slides/projects/jindou-corporate/deck/index.html',
    tags: ['金豆', 'corporate', '24p', 'Atelier'],
  },
  {
    id: 'hosted-players-viper-report',
    title: 'Hosted Players 客户资产全景分析',
    subtitle: 'V.I.P.E.R. Method · 16-page executive report',
    description:
      '基于 hosted_players_fixed.csv 与完整 Markdown 报告重制的高净值客户资产战情室 slides',
    slideCount: 16,
    manifestPath: 'slides/projects/hosted-players-viper-report/manifest.json',
    deckPath: 'slides/projects/hosted-players-viper-report/deck/index.html',
    tags: ['VIPER', 'CRM', '16p', 'Report'],
  },
  {
    id: 'tongyi-online-test',
    title: 'slides.opcglobal.cn · Tongyi 在线验证',
    subtitle: 'Style C · Atelier · agent test deck',
    description:
      '通义 qwen3.7-max 驱动的 docx + guizang HTML 双轨验证 deck — 部署于 slides_decks volume',
    slideCount: 10,
    manifestPath: 'slides/projects/tongyi-online-test/manifest.json',
    deckPath: 'slides/projects/tongyi-online-test/deck/index.html',
    tags: ['tongyi', 'deploy', '10p', 'Atelier'],
  },
  {
    id: '2day-fb-profit2chain',
    title: '餐饮单店盈利实战',
    subtitle: '从活下去到可复制',
    description: '两天闭门工坊 · 盈利模型 × 产品结构 × 连锁种子 · 600 页互动旅程（含案例闪频流）',
    slideCount: 600,
    manifestPath: 'slides/projects/2day_FB_Profit2chain/manifest.json',
    deckPath: 'slides/projects/2day_FB_Profit2chain/deck/index.html',
    tags: ['餐饮', '培训', '600p', 'F&B'],
  },
];

export function getProject(id: string): AtelierProject | undefined {
  return ATELIER_PROJECTS.find((p) => p.id === id);
}

export async function fetchProjectManifest(manifestPath: string): Promise<{
  modules: ProjectModule[];
  visualStreams?: ProjectVisualStream[];
  slideCount: number;
  title: string;
  subtitle: string;
}> {
  const res = await fetch(`/api/project-manifest?path=${encodeURIComponent(manifestPath)}`);
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  return res.json() as Promise<{
    modules: ProjectModule[];
    visualStreams?: ProjectVisualStream[];
    slideCount: number;
    title: string;
    subtitle: string;
  }>;
}

export function previewDeckUrl(deckPath: string, slide = 1): string {
  const hash = slide > 1 ? `#${slide}` : '';
  return `/api/preview?path=${encodeURIComponent(deckPath)}${hash}`;
}

export function exportPdfUrl(deckPath: string, slide: number): string {
  const q = new URLSearchParams({
    path: deckPath,
    slide: String(slide),
  });
  return `/api/export-pdf?${q}`;
}
