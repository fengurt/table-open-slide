import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { tagSlideBlocks } from './slideBlockTag.js';
import { buildLayoutCss, injectLayoutProbeScript, layoutForLang, readSlideLayoutFile, TYPOGRAPHY_CSS, } from './slideLayout.js';
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
});
const FONT_LINK = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">';
const VIEWER_STYLES = `
/* kind-viewer-stage */
html,body{margin:0;padding:0;width:1280px;height:720px;overflow:hidden;background:#0B0F19}
body>.slide-container{width:1280px;height:720px;min-height:720px;max-height:720px;overflow:hidden}
`;
const DEFAULT_STYLES = `
*{box-sizing:border-box}
body{margin:0}
.slide-container{width:1280px;min-height:720px;background:#0B0F19;color:#F1F5F9;font-family:'Work Sans',sans-serif;position:relative;overflow:hidden}
.slide-md-body{width:100%;min-height:720px;padding:48px 56px}
.slide-md-body h1,.slide-md-body h2,.slide-md-body h3{font-family:'Inter',sans-serif;color:#F1F5F9}
.slide-md-body p,.slide-md-body li{color:#CBD5E1;line-height:1.55;font-size:22px}
.slide-md-body strong{color:#38BDF8}
`;
const SLIDE_W = 1280;
let deckBaseCssCache = null;
async function getDeckBaseCss(deckRoot) {
    if (deckBaseCssCache !== null)
        return deckBaseCssCache;
    try {
        deckBaseCssCache = await fs.readFile(path.join(deckRoot, 'deck-base.css'), 'utf8');
    }
    catch {
        deckBaseCssCache = '';
    }
    return deckBaseCssCache;
}
const HOST_LAYOUT_ROW = '.slide-md-host .slide-container{display:flex!important;flex-direction:row!important;height:720px;min-height:720px;max-height:720px;width:1280px}';
const HOST_LAYOUT_STACK = '.slide-md-host .slide-container{display:flex!important;flex-direction:column!important;height:720px;min-height:720px;max-height:720px;width:1280px}';
/** Only inspect `.slide-container { ... }`, not child rules like `.right-panel { flex-direction: column }`. */
function slideContainerUsesColumnLayout(styles) {
    for (const m of styles.matchAll(/\.slide-container\s*\{([^}]*)\}/gi)) {
        if (/flex-direction:\s*column/i.test(m[1]))
            return true;
    }
    return false;
}
function hasSlideRoot(html) {
    return /class=["'][^"']*\bslide-container\b/i.test(html);
}
function slideIdFromRel(rel) {
    return path.basename(rel, '.html');
}
export function splitLocaleMd(raw) {
    const enMatch = raw.match(/<!--\s*en\s*-->([\s\S]*?)(?=<!--\s*zh\s*-->|$)/i);
    const zhMatch = raw.match(/<!--\s*zh\s*-->([\s\S]*?)$/i);
    const en = enMatch?.[1]?.trim();
    const zh = zhMatch?.[1]?.trim();
    if (en || zh) {
        return {
            en: en || zh || raw.trim(),
            zh: zh || en || raw.trim(),
        };
    }
    return { en: raw.trim(), zh: raw.trim() };
}
function extractStylesFromHtml(html) {
    const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    if (blocks.length === 0)
        return DEFAULT_STYLES;
    return blocks.map((m) => m[1]).join('\n');
}
function isFullHtmlDocument(s) {
    return /<!DOCTYPE\s+html/i.test(s) || /<html[\s>]/i.test(s);
}
function renderFragment(source) {
    const trimmed = source.trim();
    if (!trimmed)
        return '<p></p>';
    if (isFullHtmlDocument(trimmed))
        return trimmed;
    if (trimmed.startsWith('<') && trimmed.includes('>'))
        return trimmed;
    return md.render(trimmed);
}
function injectViewerStyles(html) {
    if (html.includes('kind-viewer-stage'))
        return html;
    const tag = `<style>${VIEWER_STYLES}</style>`;
    if (/<\/head>/i.test(html))
        return html.replace(/<\/head>/i, `${tag}\n</head>`);
    return `${tag}\n${html}`;
}
function wrapInSlideShell(bodyInner, styles, lang, embedRoot, deckBaseCss) {
    const body = embedRoot ? bodyInner : `<div class="slide-container">\n${bodyInner}\n</div>`;
    const hostLayout = embedRoot
        ? slideContainerUsesColumnLayout(styles)
            ? HOST_LAYOUT_STACK
            : HOST_LAYOUT_ROW
        : HOST_LAYOUT_STACK;
    return injectViewerStyles(`<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=${SLIDE_W}"/>
${FONT_LINK}
<style>${styles}
${deckBaseCss}
${VIEWER_STYLES}
${hostLayout}
</style>
</head>
<body class="slide-md-host">
${body}
</body>
</html>`);
}
async function readTextIfExists(filePath) {
    try {
        return await fs.readFile(filePath, 'utf8');
    }
    catch (e) {
        if (e.code === 'ENOENT')
            return null;
        throw e;
    }
}
async function applySlidePostProcess(html, deckRoot, rel, lang, options) {
    const layoutProbe = options.layoutProbe === true;
    const layoutApply = options.layoutApply === true;
    const layoutEdit = options.layoutEdit === true;
    const tagged = tagSlideBlocks(html);
    let out = tagged.html;
    const layoutFile = layoutApply || layoutEdit ? await readSlideLayoutFile(deckRoot, rel) : null;
    const blocks = layoutForLang(layoutFile, lang);
    const layoutLabels = { ...tagged.labels, ...layoutFile?.labels };
    const layoutCss = buildLayoutCss(blocks, layoutLabels);
    const hasLayout = Object.keys(blocks).length > 0;
    const langClass = lang === 'zh' ? 'kind-zh-typography' : '';
    const bodyClass = [
        'slide-md-host',
        hasLayout ? 'kind-layout-active' : '',
        layoutEdit ? 'kind-layout-edit-host' : '',
        langClass,
    ]
        .filter(Boolean)
        .join(' ');
    const { LAYOUT_EDIT_CSS, injectLayoutEditScript } = await import('./slideLayoutEdit.js');
    const deckBaseCss = await getDeckBaseCss(deckRoot);
    const deckBaseBlock = html.includes('KiND BP deck') ? '' : `${deckBaseCss}\n`;
    const editCss = layoutEdit ? LAYOUT_EDIT_CSS : '';
    const extraStyle = `${deckBaseBlock}${layoutCss}\n${editCss}\n${lang === 'zh' ? TYPOGRAPHY_CSS : ''}`;
    const probe = layoutProbe ? injectLayoutProbeScript() : '';
    const editScript = layoutEdit ? injectLayoutEditScript() : '';
    if (/<body[^>]*class="/i.test(out)) {
        out = out.replace(/<body([^>]*)class="([^"]*)"/i, (_, pre, cls) => {
            const merged = [...new Set(`${cls} ${bodyClass}`.trim().split(/\s+/))].join(' ');
            return `<body${pre}class="${merged}"`;
        });
    }
    else if (/<body/i.test(out)) {
        out = out.replace(/<body/i, `<body class="${bodyClass}"`);
    }
    if (/<\/style>/i.test(out)) {
        out = out.replace(/<\/style>/i, `${extraStyle}\n</style>`);
    }
    if (/<\/body>/i.test(out)) {
        out = out.replace(/<\/body>/i, `${probe}${editScript}\n</body>`);
    }
    return out;
}
export async function resolveSlideHtml(deckRoot, rel, lang, options) {
    const layoutProbe = options?.layoutProbe === true;
    const layoutApply = options?.layoutApply === true;
    const layoutEdit = options?.layoutEdit === true;
    const id = slideIdFromRel(rel);
    const htmlPath = path.join(deckRoot, `${id}.html`);
    const mdPath = path.join(deckRoot, `${id}.md`);
    const [mdRaw, htmlRaw] = await Promise.all([
        readTextIfExists(mdPath),
        readTextIfExists(htmlPath),
    ]);
    const styles = htmlRaw ? extractStylesFromHtml(htmlRaw) : DEFAULT_STYLES;
    const deckBaseCss = await getDeckBaseCss(deckRoot);
    let html;
    if (mdRaw) {
        const parts = splitLocaleMd(mdRaw);
        const chunk = parts[lang] || parts.en;
        const rendered = renderFragment(chunk);
        if (isFullHtmlDocument(rendered)) {
            html = injectViewerStyles(rendered);
        }
        else if (hasSlideRoot(rendered)) {
            html = wrapInSlideShell(rendered, styles, lang, true, deckBaseCss);
        }
        else {
            const inner = rendered.includes('slide-md-body')
                ? rendered
                : `<div class="slide-md-body">${rendered}</div>`;
            html = wrapInSlideShell(inner, styles, lang, false, deckBaseCss);
        }
    }
    else if (htmlRaw) {
        html = injectViewerStyles(htmlRaw);
    }
    else {
        throw new Error('slide not found');
    }
    return applySlidePostProcess(html, deckRoot, rel, lang, { layoutProbe, layoutApply, layoutEdit });
}
