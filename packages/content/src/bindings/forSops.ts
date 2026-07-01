import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';

export async function forSopsIndexTitle(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<string> {
  const block = await client.getContentBlockByKey('sops.indexTitle', locale);
  const body = block?.body;
  if (!body) return 'Standard operating procedures';
  return body[locale] || body.en || 'Standard operating procedures';
}
