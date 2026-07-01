/** Column modules (depth 1 only — tagged in slideBlockTag). */
export const LAYOUT_PANEL_CLASSES = ['left-panel', 'right-panel'] as const;

/** Classes that become selectable layout objects (one box per logical text region). */
export const LAYOUT_OBJECT_CLASSES = [
  ...LAYOUT_PANEL_CLASSES,
  'benefit-item',
  'outcome-item',
  'mentorship-item',
  'content-block',
  'mission-item',
  'problem-row',
  'summary-item',
  'summary-box',
  'product-card',
  'use-case-item',
  'use-case-card',
  'founding-card',
  'team-member',
  'talent-row',
  'moat-item',
  'pillar-card',
  'pillar-block',
  'problem-grid',
  'header-section',
  'belief-box',
  'footer-text',
] as const;

export const LAYOUT_HEADING_CLASSES = ['huge-title', 'subtitle', 'tagline', 'huge-text', 'vision-big'] as const;

const OBJECT_SET = new Set<string>([
  ...LAYOUT_OBJECT_CLASSES,
  ...LAYOUT_HEADING_CLASSES,
]);

export function isLayoutObjectLabel(label: string): boolean {
  return OBJECT_SET.has(primaryClassFromLabel(label));
}

/** For inline probe script (regex on primary class token). */
export function layoutObjectLabelPattern(): string {
  return [...OBJECT_SET].join('|');
}

export function primaryClassFromLabel(label: string): string {
  return label.split(/\s+/)[0] ?? label;
}
