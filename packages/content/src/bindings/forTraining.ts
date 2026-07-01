import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';

export async function forTrainingModuleTitle(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<string> {
  const block = await client.getContentBlockByKey('training.moduleTitle', locale);
  const body = block?.body;
  if (!body) return 'Training';
  return body[locale] || body.en || 'Training';
}
