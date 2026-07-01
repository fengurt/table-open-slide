import { applyEditableToHtml, htmlToEditable } from './slideMdEdit.js';
const FIELD_CLASS_RE = /^[a-z][a-z0-9-]*$/i;
function findBlockOpen(html, blockId) {
    const id = blockId.replace(/"/g, '');
    const re = new RegExp(`<(div|h[12])(\\s[^>]*data-kind-block="${id}"[^>]*)>`, 'i');
    const m = re.exec(html);
    if (!m)
        return null;
    return { tag: m[1].toLowerCase(), start: m.index, openEnd: m.index + m[0].length };
}
function findMatchingClose(html, tag, openEnd) {
    if (tag === 'div') {
        const slice = html.slice(openEnd);
        let depth = 1;
        let i = 0;
        while (i < slice.length && depth > 0) {
            const nextOpen = slice.indexOf('<div', i);
            const nextClose = slice.indexOf('</div>', i);
            if (nextClose === -1)
                return null;
            const isOpen = nextOpen !== -1 && nextOpen < nextClose;
            if (isOpen) {
                depth += 1;
                i = nextOpen + 4;
            }
            else {
                depth -= 1;
                if (depth === 0)
                    return openEnd + nextClose + 6;
                i = nextClose + 6;
            }
        }
        return null;
    }
    const close = `</${tag}>`;
    const idx = html.indexOf(close, openEnd);
    return idx === -1 ? null : idx + close.length;
}
/** Extract outer HTML of the element with data-kind-block="{id}". */
export function extractBlockFragment(html, blockId) {
    const open = findBlockOpen(html, blockId);
    if (!open)
        return null;
    const end = findMatchingClose(html, open.tag, open.openEnd);
    if (end === null)
        return null;
    return html.slice(open.start, end);
}
export function blockFragmentToEditable(fragment) {
    return htmlToEditable(fragment);
}
export function applyEditableToBlockFragment(fragment, editable) {
    return applyEditableToHtml(fragment, editable);
}
export function applyBlockEditableToSlideHtml(slideHtml, blockId, editable) {
    const fragment = extractBlockFragment(slideHtml, blockId);
    if (!fragment)
        return null;
    const updated = applyEditableToBlockFragment(fragment, editable);
    const open = findBlockOpen(slideHtml, blockId);
    if (!open)
        return null;
    const end = findMatchingClose(slideHtml, open.tag, open.openEnd);
    if (end === null)
        return null;
    return slideHtml.slice(0, open.start) + updated + slideHtml.slice(end);
}
/** Update one child field inside a block (plain text only — no HTML injection). */
export function patchBlockFieldInFragment(fragment, fieldClass, plainText) {
    if (!FIELD_CLASS_RE.test(fieldClass))
        return null;
    const re = new RegExp(`<([a-z][a-z0-9]*)(\\s[^>]*class="[^"]*\\b${fieldClass}\\b[^"]*"[^>]*)>([\\s\\S]*?)</\\1>`, 'i');
    const m = re.exec(fragment);
    if (!m)
        return null;
    const childHtml = m[0];
    const updatedChild = applyEditableToHtml(childHtml, plainText);
    return fragment.slice(0, m.index) + updatedChild + fragment.slice(m.index + childHtml.length);
}
export function patchBlockFieldInSlideHtml(slideHtml, blockId, fieldClass, plainText) {
    const fragment = extractBlockFragment(slideHtml, blockId);
    if (!fragment)
        return null;
    const patched = patchBlockFieldInFragment(fragment, fieldClass, plainText);
    if (!patched)
        return null;
    const open = findBlockOpen(slideHtml, blockId);
    if (!open)
        return null;
    const end = findMatchingClose(slideHtml, open.tag, open.openEnd);
    if (end === null)
        return null;
    return slideHtml.slice(0, open.start) + patched + slideHtml.slice(end);
}
