import type { SlideLang } from './slideRender.js';

export type LayoutBox = {
  /** percent 0–100 of slide width */
  x: number;
  /** percent 0–100 of slide height */
  y: number;
  w: number;
  h: number;
};

export type SlideLayoutLocale = Record<string, LayoutBox>;

export type SlideLayoutFile = {
  version: 1;
  labels?: Record<string, string>;
  en?: SlideLayoutLocale;
  zh?: SlideLayoutLocale;
};

export function layoutForLang(file: SlideLayoutFile | null, lang: SlideLang): SlideLayoutLocale {
  if (!file) return {};
  return lang === 'zh' ? (file.zh ?? {}) : (file.en ?? {});
}

export function clampBox(box: LayoutBox): LayoutBox {
  const w = Math.max(4, Math.min(100, box.w));
  const h = Math.max(4, Math.min(100, box.h));
  const x = Math.max(0, Math.min(100 - w, box.x));
  const y = Math.max(0, Math.min(100 - h, box.y));
  return { x, y, w, h };
}
