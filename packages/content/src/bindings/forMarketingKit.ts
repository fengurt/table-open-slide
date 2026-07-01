import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';

export async function forMarketingKitTitle(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<string> {
  const block = await client.getContentBlockByKey('marketing-kit.packTitle', locale);
  const body = block?.body;
  if (!body) return 'Marketing kit';
  return body[locale] || body.en || 'Marketing kit';
}
