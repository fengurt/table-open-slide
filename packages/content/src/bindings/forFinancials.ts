import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';

export async function forFinancialsHeadline(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<string> {
  const block = await client.getContentBlockByKey('financials.headline', locale);
  const body = block?.body;
  if (!body) return 'Financials';
  return body[locale] || body.en || 'Financials';
}
