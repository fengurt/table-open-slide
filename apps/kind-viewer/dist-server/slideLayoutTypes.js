export function layoutForLang(file, lang) {
    if (!file)
        return {};
    return lang === 'zh' ? (file.zh ?? {}) : (file.en ?? {});
}
export function clampBox(box) {
    const w = Math.max(4, Math.min(100, box.w));
    const h = Math.max(4, Math.min(100, box.h));
    const x = Math.max(0, Math.min(100 - w, box.x));
    const y = Math.max(0, Math.min(100 - h, box.y));
    return { x, y, w, h };
}
