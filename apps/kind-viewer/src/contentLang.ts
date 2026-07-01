export type ContentLang = 'en' | 'zh';

const KEY = 'kind-content-lang';

export function loadContentLang(): ContentLang {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

export function saveContentLang(lang: ContentLang): void {
  localStorage.setItem(KEY, lang);
}
