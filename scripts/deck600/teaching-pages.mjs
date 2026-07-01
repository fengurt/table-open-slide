/**
 * 600 页 spec 入口：page-specs + MD 解析 + 权威数据 + 运行时补全
 */
import { enrichPage } from './authority-data.mjs';
import { enrichTeaching, enrichVisual } from './enrich-spec.mjs';
import { MODULES, MODULE_STARTS } from './constants.mjs';
import { loadParsedMd } from './parse-md.mjs';
import {
  getFullTeachingSpec,
  getFullVisualSpec,
} from './page-specs.mjs';

let mdCache = null;

async function ensureMd() {
  if (!mdCache) mdCache = await loadParsedMd();
  return mdCache;
}

/** sync path for build-deck */
export function getPageSpec(page) {
  const mod =
    MODULES.find((m) => page >= m.start && page <= m.end && m.id.startsWith('m')) ||
    MODULES.find((m) => page >= m.start && page <= m.end);
  const act = mod?.act ?? 'Workshop';
  const meta = {
    act,
    modTitle: mod?.title ?? '实战现场',
    moduleId: mod?.id ?? 'm1',
  };

  // Module dividers
  if (MODULE_STARTS.has(page) && page > 1 && page <= 138) {
    const titles = {
      14: '营收公式拆解',
      31: '重新定义对手',
      42: '单店生死线',
      54: '三种模型三种活法',
      66: '产品结构是翻译器',
      77: '菜单外科手术',
      91: '主辅佐引战略重构',
      104: '价格带是你设计的',
      113: '外卖是数字侦察兵',
      119: '九宫格货架',
      126: '连锁是复制盈利模型',
      134: '六十天康复室',
    };
    const base = getFullTeachingSpec(page);
    return enrichTeaching({
      page,
      layout: 'act-divider',
      kicker: mod?.title.split('·')[1]?.trim() || mod?.title,
      title: titles[page] || mod?.title,
      lead: '告别直觉，走向精确。',
      pace: '慢板推演流',
      visual: base?.visual,
      script: base?.script,
      notes: base?.notes,
      _meta: meta,
    });
  }

  let spec;
  if (page <= 138) {
    const fromMd = mdCache?.get(page);
    const fromCatalog = getFullTeachingSpec(page);
    spec = fromMd
      ? {
          ...fromCatalog,
          ...fromMd,
          page,
          layout: fromCatalog?.layout || fromMd.layout,
          kicker: fromCatalog?.kicker || fromMd.kicker,
          lead: fromCatalog?.lead,
          tagline: fromCatalog?.tagline,
          stats: fromCatalog?.stats ?? fromMd.stats,
          columns: fromCatalog?.columns ?? fromMd.columns,
          checklist: fromCatalog?.checklist ?? fromMd.checklist,
          timer: fromCatalog?.timer ?? fromMd.timer,
          step: fromCatalog?.step ?? fromMd.step,
          caseFacts: fromCatalog?.caseFacts ?? fromMd.caseFacts,
          script: fromMd.script || fromCatalog?.script,
          notes: fromMd.notes || fromCatalog?.notes,
          visual: fromMd.visual || fromCatalog?.visual,
        }
      : fromCatalog;
    spec = enrichTeaching(enrichPage(page, spec));
  } else {
    spec = enrichVisual(getFullVisualSpec(page));
  }

  if (!spec) {
    spec = {
      page,
      layout: 'structure',
      kicker: meta.modTitle,
      title: `${meta.modTitle} · 第 ${page} 页`,
      visual: '结构透视 · 方法论推演',
      script: '用数字说话，用模型决策。',
    };
  }

  return { ...spec, _meta: meta };
}

/** preload MD before sync build */
export async function preloadMd() {
  mdCache = await loadParsedMd();
}

export async function initPageSpecs() {
  await preloadMd();
}

// Re-export for export-md
export { getFullTeachingSpec, getFullVisualSpec } from './page-specs.mjs';
