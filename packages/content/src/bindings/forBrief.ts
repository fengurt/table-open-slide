import type { TableContentClient } from '../client';
import type { ContentLocaleId } from '../locale';

export async function forBriefExecutiveSummary(
  client: TableContentClient,
  locale: ContentLocaleId,
): Promise<string> {
  const block = await client.getContentBlockByKey('brief.executiveSummary', locale);
  const body = block?.body;
  if (!body) return '';
  return body[locale] || body.en || '';
}
