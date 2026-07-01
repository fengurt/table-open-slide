import type { ContentLocaleId } from './locale';
import type { ContentBlock } from './schemas/content-block';

export type PayloadListResponse<T> = {
  docs: T[];
  totalDocs?: number;
};

export type TableContentClientOptions = {
  apiBaseUrl: string;
  fetchImpl?: typeof fetch;
};

export function createTableContentClient(opts: TableContentClientOptions) {
  const fetchFn = opts.fetchImpl ?? fetch;
  const base = opts.apiBaseUrl.replace(/\/+$/, '');

  async function getContentBlockByKey(
    key: string,
    locale: ContentLocaleId,
  ): Promise<ContentBlock | null> {
    const query = new URLSearchParams();
    query.set('where[key][equals]', key);
    query.set('locale', locale);
    query.set('limit', '1');
    query.set('depth', '0');
    const res = await fetchFn(`${base}/content-blocks?${query.toString()}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PayloadListResponse<Record<string, unknown>>;
    const doc = data.docs[0];
    if (!doc) return null;
    return payloadDocToContentBlock(doc, locale);
  }

  return {
    baseUrl: base,
    getContentBlockByKey,
  };
}

export type TableContentClient = ReturnType<typeof createTableContentClient>;

function payloadDocToContentBlock(
  doc: Record<string, unknown>,
  fallbackLocale: ContentLocaleId,
): ContentBlock {
  const key = String(doc.key ?? '');
  const bodyRaw = doc.body;
  const body: ContentBlock['body'] = {
    en: '',
    'zh-CN': '',
    'zh-TW': '',
    ja: '',
  };
  if (typeof bodyRaw === 'string') {
    body[fallbackLocale] = bodyRaw;
    body.en = bodyRaw;
  } else if (bodyRaw && typeof bodyRaw === 'object') {
    for (const k of Object.keys(body)) {
      const v = (bodyRaw as Record<string, string>)[k];
      if (typeof v === 'string') (body as Record<string, string>)[k] = v;
    }
  }
  return {
    id: typeof doc.id === 'string' ? doc.id : String(doc.id ?? ''),
    key,
    body,
  };
}
