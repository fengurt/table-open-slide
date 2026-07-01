import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';
import type { ContentBlock } from '../schemas/content-block';

export type SlideHeroCopy = {
  eyebrow: string;
  title: string;
};

export async function forSlideHero(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<SlideHeroCopy> {
  const eyebrow = await client.getContentBlockByKey('website.hero.eyebrow', locale);
  const title = await client.getContentBlockByKey('website.hero.title', locale);
  return {
    eyebrow: pickLocalized(eyebrow?.body, locale, 'Slides'),
    title: pickLocalized(title?.body, locale, 'Content OS'),
  };
}

function pickLocalized(
  body: ContentBlock['body'] | undefined,
  locale: ContentLocaleId,
  fallback: string,
): string {
  if (!body) return fallback;
  const row = body as Record<ContentLocaleId, string>;
  return row[locale] || row.en || fallback;
}
