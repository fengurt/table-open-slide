export const CONTENT_LOCALES = ['en', 'zh-CN', 'zh-TW', 'ja'] as const;

export type ContentLocaleId = (typeof CONTENT_LOCALES)[number];

export function isContentLocaleId(value: string): value is ContentLocaleId {
  return (CONTENT_LOCALES as readonly string[]).includes(value);
}
