import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';

export async function forSuccessionPlanTitle(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<string> {
  const block = await client.getContentBlockByKey('succession.title', locale);
  const body = block?.body;
  if (!body) return 'Succession plan';
  return body[locale] || body.en || 'Succession plan';
}
