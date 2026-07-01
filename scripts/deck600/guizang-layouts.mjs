/** guizang-ppt-skill · Atelier v2 · 编辑级幻灯片布局 */
import { TOTAL } from './constants.mjs';
import { speakerAttrs } from './to-slide-spec.mjs';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function head(page) {
  const n = String(page).padStart(3, '0');
  return `<div class="slide-head"><span class="slide-num">${n}</span></div>`;
}

function foot(modTitle) {
  return `<div class="slide-foot"><span class="slide-module">${esc(modTitle)}</span></div>`;
}

function visPanel(variant = 0) {
  const v = variant % 4;
  return `<div class="vis-panel" data-v="${v}" data-anim aria-hidden="true"><div class="vis-grain"></div></div>`;
}

function flowChain(text) {
  const parts = String(text)
    .split(/→|->/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return '';
  return `<div class="flow-chain" data-anim>${parts
    .map((p, i) => `${i ? '<span class="flow-arrow"></span>' : ''}<span class="flow-node">${esc(p)}</span>`)
    .join('')}</div>`;
}

function flowFromSpec(spec) {
  if (spec.body?.includes('→')) return flowChain(spec.body);
  if (spec.kicker?.includes('→')) return flowChain(spec.kicker);
  if (spec.kicker?.includes('·') && !/模块|Day|标杆/.test(spec.kicker)) {
    return flowChain(spec.kicker.replace(/·/g, '→'));
  }
  return '';
}

function factPills(facts) {
  if (!facts?.length) return '';
  return `<div class="fact-row" data-anim>${facts.map((f) => `<span class="fact-pill">${esc(f)}</span>`).join('')}</div>`;
}

function shortSource(subline) {
  if (!subline) return '';
  const s = subline.replace(/^数据来源 ·\s*/, '').slice(0, 80);
  return `<p class="stat-foot" data-anim>${esc(s)}</p>`;
}

export function sectionWrap({ page, theme, cls, moduleId, animate, body, speaker }) {
  const classes = ['slide', ...(cls || []), ...(theme?.includes('hero') ? ['hero'] : [])].join(' ');
  const th = theme?.includes('light') ? 'light' : 'dark';
  return `<section class="${classes}" data-theme="${th}" data-module="${esc(moduleId)}" data-page="${page}"${animate ? ` data-animate="${esc(animate)}"` : ''}${speakerAttrs(speaker)}>
${body}
</section>`;
}

export function layoutHeroCover(spec, meta) {
  return sectionWrap({
    page: spec.page,
    theme: 'hero dark',
    cls: ['dark'],
    moduleId: meta.moduleId,
    animate: 'hero',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame hero-stage">
    <span class="hero-kicker" data-anim>${esc(spec.kicker)}</span>
    <div class="gold-rule wide" data-anim></div>
    <h1 class="hero-title" data-anim>${esc(spec.title)}</h1>
    <p class="hero-sub" data-anim>${esc(spec.lead || spec.body)}</p>
    ${spec.tagline ? `<span class="hero-tag" data-anim>${esc(spec.tagline)}</span>` : ''}
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutActDivider(spec, meta) {
  const light = spec.page % 2 === 0;
  const modNum = meta.moduleId?.replace('m', '') || '';
  return sectionWrap({
    page: spec.page,
    theme: light ? 'hero light' : 'hero dark',
    cls: [light ? 'light' : 'dark'],
    moduleId: meta.moduleId,
    animate: 'hero',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame act-stage">
    ${modNum ? `<span class="act-num" data-anim>${esc(modNum)}</span>` : ''}
    <div class="gold-rule" data-anim></div>
    <h1 class="act-title" data-anim>${esc(spec.title)}</h1>
    ${spec.lead || spec.body ? `<p class="act-lead" data-anim>${esc(spec.lead || spec.body)}</p>` : ''}
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutStatHero(spec, meta) {
  const st = spec.stats?.[0];
  const ghost = st?.ghost || st?.n?.replace(/\D/g, '').slice(0, 2) || '';
  return sectionWrap({
    page: spec.page,
    theme: 'dark',
    cls: ['dark'],
    moduleId: meta.moduleId,
    animate: 'cascade',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame stat-stage">
    ${ghost ? `<span class="ghost-n" aria-hidden="true">${esc(ghost)}</span>` : ''}
    <span class="page-kicker" data-anim>${esc(spec.kicker)}</span>
    <div class="stat-core" data-anim>
      <span class="n">${esc(st?.n)}<span class="unit">${esc(st?.unit || '')}</span></span>
      <span class="label">${esc(st?.label)}</span>
    </div>
    ${shortSource(spec.subline)}
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutDualStat(spec, meta) {
  const [a, b] = spec.stats || [];
  return sectionWrap({
    page: spec.page,
    theme: 'dark',
    cls: ['dark'],
    moduleId: meta.moduleId,
    animate: 'cascade',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame frame-main">
    <span class="page-kicker" data-anim>${esc(spec.kicker)}</span>
    <h2 class="page-title" data-anim>${esc(spec.title)}</h2>
    <div class="dual-grid" data-anim>
      <div class="dual-cell"><div class="n">${esc(a?.n)}${esc(a?.unit || '')}</div><p class="lbl">${esc(a?.label)}</p></div>
      <div class="dual-cell"><div class="n">${esc(b?.n)}${esc(b?.unit || '')}</div><p class="lbl">${esc(b?.label)}</p></div>
    </div>
    ${shortSource(spec.subline)}
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutQuote(spec, meta) {
  return sectionWrap({
    page: spec.page,
    theme: 'dark',
    cls: ['dark', 'hero'],
    moduleId: meta.moduleId,
    animate: 'quote',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame quote-stage">
    <span class="mark" data-anim aria-hidden="true">"</span>
    <span class="page-kicker" data-anim>${esc(spec.kicker)}</span>
    <p class="q" data-anim="line">${esc(spec.title)}</p>
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutBeforeAfter(spec, meta) {
  const [before, after] = spec.columns || [];
  return sectionWrap({
    page: spec.page,
    theme: 'light',
    cls: ['light'],
    moduleId: meta.moduleId,
    animate: 'directional',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame frame-main">
    <span class="page-kicker" data-anim>${esc(spec.kicker)}</span>
    <h2 class="page-title" data-anim>${esc(spec.title)}</h2>
    <div class="ba-grid" data-anim>
      <div class="ba-card before">
        <span class="ba-tag">${esc(before?.tag || 'A')}</span>
        <p class="ba-title">${esc(before?.title)}</p>
        <p class="ba-body">${esc(before?.body)}</p>
      </div>
      <div class="divider"></div>
      <div class="ba-card after">
        <span class="ba-tag">${esc(after?.tag || 'B')}</span>
        <p class="ba-title">${esc(after?.title)}</p>
        <p class="ba-body">${esc(after?.body)}</p>
      </div>
    </div>
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutPipelineStep(spec, meta) {
  const step = spec.step || {};
  const light = spec.page % 2 === 1;
  return sectionWrap({
    page: spec.page,
    theme: light ? 'light' : 'dark',
    cls: [light ? 'light' : 'dark'],
    moduleId: meta.moduleId,
    animate: 'pipeline',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame pipe-stage">
    <span class="page-kicker" data-anim>${esc(spec.kicker)}</span>
    <h2 class="page-title" data-anim>${esc(spec.title)}</h2>
    <div class="pipe-step" data-anim="step">
      <span class="pipe-nb">${esc(step.index || '01')}</span>
      <p class="pipe-name">${esc(step.name)}</p>
      <p class="pipe-desc">${esc(step.desc)}</p>
    </div>
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutSplitText(spec, meta) {
  const light = spec.page % 2 === 0;
  const brand = spec.kicker?.replace(/^标杆 ·\s*/, '') || spec.brand || '';
  return sectionWrap({
    page: spec.page,
    theme: light ? 'light' : 'dark',
    cls: [light ? 'light' : 'dark'],
    moduleId: meta.moduleId,
    animate: 'cascade',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame case-split">
    <div>
      ${brand ? `<span class="case-brand" data-anim>${esc(brand)}</span>` : `<span class="page-kicker" data-anim>${esc(spec.kicker)}</span>`}
      <h2 class="case-title" data-anim>${esc(spec.title)}</h2>
      ${factPills(spec.caseFacts)}
    </div>
    ${visPanel(spec.page)}
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutAction(spec, meta) {
  const items = spec.checklist || [];
  return sectionWrap({
    page: spec.page,
    theme: 'light',
    cls: ['light'],
    moduleId: meta.moduleId,
    animate: 'cascade',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame action-stage">
    <span class="page-kicker" data-anim>${esc(spec.kicker)}</span>
    <h2 class="action-title" data-anim>${esc(spec.title)}</h2>
    ${spec.timer ? `<div class="action-timer" data-anim>${esc(spec.timer)}</div>` : ''}
    <ul class="action-list" data-anim>
      ${items.map((c, i) => `<li data-i="${String(i + 1).padStart(2, '0')}">${esc(c)}</li>`).join('\n      ')}
    </ul>
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutFlash(spec, meta) {
  const scene = spec.title || spec.mediaCaption || '';
  return sectionWrap({
    page: spec.page,
    theme: 'dark',
    cls: ['dark'],
    moduleId: meta.moduleId,
    animate: 'cascade',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame frame-main">
    <div class="flash-stage" data-v="${(spec.variant ?? spec.page) % 4}" data-anim>
      <div class="vis-grain"></div>
      ${spec.beatSeq ? `<span class="flash-seq">${esc(spec.beatSeq)}</span>` : ''}
      <div class="flash-overlay">
        <span class="flash-brand">${esc(spec.brand || spec.tag || '')}</span>
        <h2 class="flash-scene">${esc(scene)}</h2>
      </div>
    </div>
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function layoutStructure(spec, meta) {
  const light = spec.page % 3 === 0;
  const flow = flowFromSpec(spec);
  const bodyText = flow ? '' : spec.body;
  return sectionWrap({
    page: spec.page,
    theme: light ? 'light' : 'dark',
    cls: [light ? 'light' : 'dark'],
    moduleId: meta.moduleId,
    animate: 'cascade',
    speaker: spec._speaker,
    body: `${head(spec.page)}
  <div class="frame frame-main">
    <span class="page-kicker" data-anim>${esc(spec.kicker)}</span>
    <div class="gold-rule" data-anim></div>
    <h2 class="page-title" data-anim>${esc(spec.title)}</h2>
    ${flow || ''}
    ${bodyText ? `<p class="act-lead" data-anim style="margin-top:3vh">${esc(bodyText)}</p>` : ''}
    ${factPills(spec.caseFacts)}
  </div>
  ${foot(meta.modTitle)}`,
  });
}

export function renderSlide(spec, meta) {
  switch (spec.layout) {
    case 'hero-cover':
      return layoutHeroCover(spec, meta);
    case 'act-divider':
      return layoutActDivider(spec, meta);
    case 'stat-hero':
      return layoutStatHero(spec, meta);
    case 'dual-stat':
      return layoutDualStat(spec, meta);
    case 'quote':
      return layoutQuote(spec, meta);
    case 'before-after':
      return layoutBeforeAfter(spec, meta);
    case 'pipeline':
      return layoutPipelineStep(spec, meta);
    case 'split-text':
      return layoutSplitText(spec, meta);
    case 'action':
      return layoutAction(spec, meta);
    case 'flash':
      return layoutFlash(spec, meta);
    default:
      return layoutStructure(spec, meta);
  }
}
