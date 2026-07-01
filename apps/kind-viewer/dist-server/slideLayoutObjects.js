/** Column modules (depth 1 only — tagged in slideBlockTag). */
export const LAYOUT_PANEL_CLASSES = ['left-panel', 'right-panel'];
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
];
export const LAYOUT_HEADING_CLASSES = ['huge-title', 'subtitle', 'tagline', 'huge-text', 'vision-big'];
const OBJECT_SET = new Set([
    ...LAYOUT_OBJECT_CLASSES,
    ...LAYOUT_HEADING_CLASSES,
]);
export function isLayoutObjectLabel(label) {
    return OBJECT_SET.has(primaryClassFromLabel(label));
}
/** For inline probe script (regex on primary class token). */
export function layoutObjectLabelPattern() {
    return [...OBJECT_SET].join('|');
}
export function primaryClassFromLabel(label) {
    return label.split(/\s+/)[0] ?? label;
}
