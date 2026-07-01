import { LAYOUT_HEADING_CLASSES, LAYOUT_OBJECT_CLASSES, LAYOUT_PANEL_CLASSES, primaryClassFromLabel, } from './slideLayoutObjects.js';
const DECO_ONLY = /^deco-/;
function extractSlideContainerInner(html) {
    const open = html.match(/<div(\s[^>]*class="[^"]*\bslide-container\b[^"]*"[^>]*)>/i);
    if (!open)
        return null;
    const start = html.indexOf(open[0]) + open[0].length;
    const slice = html.slice(start);
    let depth = 1;
    let i = 0;
    while (i < slice.length && depth > 0) {
        const nextOpen = slice.indexOf('<div', i);
        const nextClose = slice.indexOf('</div>', i);
        if (nextClose === -1)
            break;
        const isDivOpen = nextOpen !== -1 && nextOpen < nextClose;
        if (isDivOpen) {
            depth += 1;
            i = nextOpen + 4;
        }
        else {
            depth -= 1;
            if (depth === 0) {
                return { start, end: start + nextClose, inner: slice.slice(0, nextClose) };
            }
            i = nextClose + 6;
        }
    }
    return null;
}
function divDepthBefore(inner, offset) {
    const before = inner.slice(0, offset);
    let depth = 0;
    const re = /<div[\s>]|<\/div>/gi;
    let m = re.exec(before);
    while (m) {
        if (m[0].startsWith('</'))
            depth -= 1;
        else
            depth += 1;
        m = re.exec(before);
    }
    return depth;
}
function nextId(labels) {
    let n = 0;
    for (const k of Object.keys(labels)) {
        const m = /^b(\d+)$/.exec(k);
        if (m)
            n = Math.max(n, Number(m[1]) + 1);
    }
    return `b${n}`;
}
function queueDivTags(html, classes, depth, labels, inserts) {
    for (const cls of classes) {
        const re = new RegExp(`<div(\\s[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*)>`, 'gi');
        let m = re.exec(html);
        while (m) {
            const attrs = m[1];
            if (!/data-kind-block=/i.test(attrs) && divDepthBefore(html, m.index) === depth) {
                const id = nextId(labels);
                labels[id] = cls;
                inserts.push({
                    index: m.index,
                    length: m[0].length,
                    id,
                    cls,
                    open: `<div${attrs} data-kind-block="${id}">`,
                });
            }
            m = re.exec(html);
        }
    }
}
function isInsidePanel(html, offset) {
    const before = html.slice(0, offset);
    let panelDepth = 0;
    const re = /<div(\s[^>]*class="([^"]*)")[^>]*>|<\/div>/gi;
    let m = re.exec(before);
    while (m) {
        if (m[0].startsWith('</')) {
            if (panelDepth > 0)
                panelDepth -= 1;
        }
        else if (/\bleft-panel\b|\bright-panel\b/.test(m[2] ?? '')) {
            panelDepth += 1;
        }
        else if (panelDepth > 0) {
            panelDepth += 1;
        }
        m = re.exec(before);
    }
    return panelDepth > 0;
}
function queueHeadingTags(html, labels, inserts) {
    for (const cls of LAYOUT_HEADING_CLASSES) {
        const re = new RegExp(`<(h[12])(\\s[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*)>`, 'gi');
        let m = re.exec(html);
        while (m) {
            const tag = m[1];
            const attrs = m[2];
            if (isInsidePanel(html, m.index)) {
                m = re.exec(html);
                continue;
            }
            if (!/data-kind-block=/i.test(attrs)) {
                const id = nextId(labels);
                labels[id] = cls;
                inserts.push({
                    index: m.index,
                    length: m[0].length,
                    id,
                    cls,
                    open: `<${tag}${attrs} data-kind-block="${id}">`,
                });
            }
            m = re.exec(html);
        }
    }
}
function applyInserts(html, inserts) {
    inserts.sort((a, b) => b.index - a.index);
    let out = html;
    for (const ins of inserts) {
        out = out.slice(0, ins.index) + ins.open + out.slice(ins.index + ins.length);
    }
    return out;
}
function tagLayoutObjects(inner, labels) {
    const inserts = [];
    // Direct children of .slide-container (decoration siblings share depth 0; only panel classes match).
    queueDivTags(inner, LAYOUT_PANEL_CLASSES, 0, labels, inserts);
    const itemClasses = LAYOUT_OBJECT_CLASSES.filter((c) => !LAYOUT_PANEL_CLASSES.includes(c));
    for (const depth of [2, 3]) {
        queueDivTags(inner, itemClasses, depth, labels, inserts);
    }
    queueHeadingTags(inner, labels, inserts);
    return applyInserts(inner, inserts);
}
function tagAllInDocument(html, labels) {
    const region = extractSlideContainerInner(html);
    if (region) {
        const taggedInner = tagLayoutObjects(region.inner, labels);
        return html.slice(0, region.start) + taggedInner + html.slice(region.end);
    }
    let out = html;
    for (const cls of LAYOUT_OBJECT_CLASSES) {
        const re = new RegExp(`<div(\\s[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*)>`, 'gi');
        out = out.replace(re, (match, attrs) => {
            if (/data-kind-block=/i.test(attrs))
                return match;
            const id = nextId(labels);
            labels[id] = cls;
            return `<div${attrs} data-kind-block="${id}">`;
        });
    }
    return out;
}
export function tagSlideBlocks(html) {
    const labels = {};
    const region = extractSlideContainerInner(html);
    if (!region) {
        return { html: tagAllInDocument(html, labels), labels };
    }
    const taggedInner = tagLayoutObjects(region.inner, labels);
    const htmlOut = html.slice(0, region.start) + taggedInner + html.slice(region.end);
    return { html: htmlOut, labels };
}
export function blockClassFromLabel(label) {
    return !DECO_ONLY.test(label);
}
export function stripKindBlockAttrs(html) {
    return html.replace(/\s*data-kind-block="[^"]*"/gi, '');
}
export { primaryClassFromLabel };
