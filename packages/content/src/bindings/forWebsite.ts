import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';
import type { ContentBlock } from '../schemas/content-block';

export type WebsiteHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export async function forWebsiteHero(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<WebsiteHero> {
  const eyebrow = await client.getContentBlockByKey('website.hero.eyebrow', locale);
  const title = await client.getContentBlockByKey('website.hero.title', locale);
  const subtitle = await client.getContentBlockByKey('website.hero.subtitle', locale);
  return {
    eyebrow: pick(eyebrow?.body, locale, 'One graph'),
    title: pick(title?.body, locale, 'Table Content OS'),
    subtitle: pick(subtitle?.body, locale, 'Slides, site, brief, and ops — one source.'),
  };
}

function pick(
  body: ContentBlock['body'] | undefined,
  locale: ContentLocaleId,
  fallback: string,
): string {
  if (!body) return fallback;
  const row = body as Record<ContentLocaleId, string>;
  return row[locale] || row.en || fallback;
}
