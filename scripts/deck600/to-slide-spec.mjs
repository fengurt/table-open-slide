import { DECK_SUB } from './constants.mjs';

/** 幻灯片只渲染观众可见内容；script / visual / notes 进讲者备注 */
export function toSlideSpec(raw) {
  if (!raw) return raw;
  const speaker = {
    script: raw.script || '',
    notes: raw.notes || '',
    visual: raw.visual || '',
  };

  const slide = { ...raw };
  delete slide.script;
  delete slide.notes;
  delete slide.visual;

  if (!slide.lead && slide.page === 1) slide.lead = DECK_SUB;
  if (!slide.body) {
    slide.body = raw.body || raw.lead || audienceBody(raw);
  }
  if (slide.body && (slide.body === slide.kicker || slide.kicker?.includes(slide.body))) {
    slide.body = slide.body.includes('→') ? slide.body : '';
  }
  if (!slide.mediaCaption) {
    slide.mediaCaption = raw.mediaCaption || raw.imageLabel || raw.caption || '';
  }
  if (!slide.subline && raw.layout === 'stat-hero') {
    const src = raw.source || raw.statsExtra || '';
    slide.subline = src.length > 90 ? src.slice(0, 87) + '…' : src;
  }
  if (!slide.subline && raw.layout === 'dual-stat') {
    slide.subline = raw.statsExtra || '';
  }

  slide._speaker = speaker;
  return slide;
}

function audienceBody(spec) {
  if (spec.checklist?.length || spec.columns?.length || spec.stats?.length) return '';
  if (spec.layout === 'quote' || spec.layout === 'hero-cover' || spec.layout === 'act-divider') return '';
  if (spec.layout === 'stat-hero' || spec.layout === 'dual-stat') return '';
  // 仅当 kicker 是内容短语（非颗粒度/模块标签）
  if (spec.kicker && spec.kicker.length <= 36 && !/模块|推演|Day|封面|暴击|并列|锚定|模块推演/.test(spec.kicker)) {
    return spec.kicker;
  }
  return '';
}

export function speakerAttrs(speaker) {
  if (!speaker) return '';
  const parts = [];
  if (speaker.script) parts.push(`data-speaker-script="${escAttr(speaker.script)}"`);
  if (speaker.notes) parts.push(`data-speaker-notes="${escAttr(speaker.notes)}"`);
  if (speaker.visual) parts.push(`data-speaker-visual="${escAttr(speaker.visual)}"`);
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '&#10;');
}
