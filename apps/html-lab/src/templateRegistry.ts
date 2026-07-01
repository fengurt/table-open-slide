export type TuneParamDef = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  default: number;
};

export type ModuleDef = {
  id: string;
  label: string;
  selector: string;
  maxChars: number;
  /** count each match separately vs aggregate */
  perElement?: boolean;
};

export type ComponentDef = {
  id: string;
  label: string;
  selector: string;
  paramKeys: string[];
  moduleId?: string;
};

export type HtmlTemplate = {
  id: string;
  match: RegExp;
  label: string;
  params: TuneParamDef[];
  modules: ModuleDef[];
  components: ComponentDef[];
  cssVar: (key: string, value: number) => string;
};

function px(key: string, value: number): string {
  return `--hl-${key}: ${value}px`;
}

export const GUO_FENG_PROFILE: HtmlTemplate = {
  id: 'guo-feng-profile',
  match: /(guo-feng-profile|guofeng-new-profile|caiyan-profile)\.html$/i,
  label: '16:9 Profile 幻灯片',
  params: [
    {
      key: 'header-py',
      label: '页眉上下内边距',
      min: 12,
      max: 48,
      step: 1,
      unit: 'px',
      default: 28,
    },
    {
      key: 'header-px',
      label: '页眉左右内边距',
      min: 20,
      max: 64,
      step: 1,
      unit: 'px',
      default: 40,
    },
    {
      key: 'main-py',
      label: '正文区上下内边距',
      min: 8,
      max: 40,
      step: 1,
      unit: 'px',
      default: 22,
    },
    {
      key: 'main-px',
      label: '正文区左右内边距',
      min: 16,
      max: 56,
      step: 1,
      unit: 'px',
      default: 40,
    },
    { key: 'main-gap', label: '区块间距', min: 8, max: 32, step: 1, unit: 'px', default: 18 },
    { key: 'intro-size', label: '导语字号', min: 10, max: 16, step: 0.5, unit: 'px', default: 13 },
    { key: 'body-size', label: '正文字号', min: 9, max: 14, step: 0.5, unit: 'px', default: 11.5 },
    { key: 'col-pad', label: '分栏内边距', min: 8, max: 28, step: 1, unit: 'px', default: 16 },
    {
      key: 'slide-max',
      label: '幻灯片最大宽度',
      min: 960,
      max: 1400,
      step: 10,
      unit: 'px',
      default: 1280,
    },
  ],
  modules: [
    { id: 'tags', label: '页眉标签行', selector: '.tags', maxChars: 130 },
    {
      id: 'intro',
      label: '导语段落',
      selector: '[data-hl-module="intro"]',
      maxChars: 260,
      perElement: true,
    },
    {
      id: 'bg',
      label: '专业背景段落',
      selector: '[data-hl-module="bg"]',
      maxChars: 110,
      perElement: true,
    },
    {
      id: 'exp',
      label: '项目经验条目',
      selector: '[data-hl-module="exp"]',
      maxChars: 140,
      perElement: true,
    },
  ],
  components: [
    { id: 'slide', label: '幻灯片容器', selector: '.slide', paramKeys: ['slide-max'] },
    { id: 'header', label: '页眉区', selector: '.header', paramKeys: ['header-py', 'header-px'] },
    {
      id: 'tags',
      label: '页眉标签行',
      selector: '[data-hl-module="tags"]',
      paramKeys: [],
      moduleId: 'tags',
    },
    { id: 'intro-section', label: '导语区', selector: '.intro', paramKeys: ['intro-size'] },
    {
      id: 'intro-block',
      label: '导语段落',
      selector: '[data-hl-module="intro"]',
      paramKeys: ['intro-size'],
      moduleId: 'intro',
    },
    {
      id: 'main',
      label: '正文区',
      selector: '.main',
      paramKeys: ['main-py', 'main-px', 'main-gap'],
    },
    {
      id: 'bg-col',
      label: '专业背景栏',
      selector: '.col:first-child',
      paramKeys: ['col-pad', 'body-size'],
    },
    {
      id: 'bg-block',
      label: '背景段落',
      selector: '[data-hl-module="bg"]',
      paramKeys: ['body-size', 'col-pad'],
      moduleId: 'bg',
    },
    {
      id: 'exp-col',
      label: '项目经验栏',
      selector: '.col:last-child',
      paramKeys: ['col-pad', 'body-size'],
    },
    {
      id: 'exp-block',
      label: '经验条目',
      selector: '[data-hl-module="exp"]',
      paramKeys: ['body-size'],
      moduleId: 'exp',
    },
  ],
  cssVar: px,
};

export const TEMPLATES: HtmlTemplate[] = [GUO_FENG_PROFILE];

export function matchTemplate(path: string): HtmlTemplate | null {
  return TEMPLATES.find((t) => t.match.test(path)) ?? null;
}

export function defaultParams(template: HtmlTemplate): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of template.params) out[p.key] = p.default;
  return out;
}
