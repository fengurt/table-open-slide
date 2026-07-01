import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ContentLocaleId } from '../config.ts';

type CacheEntry = { value: string; loading: boolean };

type ContentContextValue = {
  apiBaseUrl: string;
  locale: ContentLocaleId;
  setLocale: (next: ContentLocaleId) => void;
  getString: (contentKey: string, fallback: string) => string;
  prefetch: (keys: string[]) => Promise<void>;
};

const ContentCtx = createContext<ContentContextValue | null>(null);

export function useSlideContentContext(): ContentContextValue | null {
  return useContext(ContentCtx);
}

export function ContentProvider({
  apiBaseUrl,
  defaultLocale,
  children,
}: {
  apiBaseUrl: string;
  defaultLocale: ContentLocaleId;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<ContentLocaleId>(defaultLocale);
  const [cache, setCache] = useState<Record<string, Partial<Record<ContentLocaleId, CacheEntry>>>>(
    {},
  );

  const readCache = useCallback(
    (key: string, loc: ContentLocaleId): string | undefined => {
      const row = cache[key]?.[loc];
      if (row && !row.loading) return row.value;
      const fallbackLoc = cache[key]?.en;
      if (fallbackLoc && !fallbackLoc.loading) return fallbackLoc.value;
      return undefined;
    },
    [cache],
  );

  const fetchKey = useCallback(
    async (key: string, loc: ContentLocaleId) => {
      setCache((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [loc]: { value: prev[key]?.[loc]?.value ?? '', loading: true },
        },
      }));
      const query = new URLSearchParams();
      query.set('where[key][equals]', key);
      query.set('locale', loc);
      query.set('limit', '1');
      query.set('depth', '0');
      const base = apiBaseUrl.replace(/\/+$/, '');
      const res = await fetch(`${base}/content-blocks?${query.toString()}`, {
        headers: { accept: 'application/json' },
      });
      let value = '';
      if (res.ok) {
        const data = (await res.json()) as { docs: Array<{ body?: string }> };
        const body = data.docs[0]?.body;
        value = typeof body === 'string' ? body : '';
      }
      setCache((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [loc]: { value, loading: false },
        },
      }));
    },
    [apiBaseUrl],
  );

  const prefetch = useCallback(
    async (keys: string[]) => {
      await Promise.all(keys.map((key) => fetchKey(key, locale)));
    },
    [fetchKey, locale],
  );

  const getString = useCallback(
    (contentKey: string, fallback: string) => {
      const hit = readCache(contentKey, locale);
      if (hit !== undefined && hit !== '') return hit;
      const enHit = readCache(contentKey, 'en');
      if (enHit !== undefined && enHit !== '') return enHit;
      void fetchKey(contentKey, locale);
      return fallback;
    },
    [fetchKey, locale, readCache],
  );

  useEffect(() => {
    void locale;
    setCache({});
  }, [locale]);

  const setLocale = useCallback((next: ContentLocaleId) => {
    setLocaleState(next);
  }, []);

  const value = useMemo<ContentContextValue>(
    () => ({
      apiBaseUrl,
      locale,
      setLocale,
      getString,
      prefetch,
    }),
    [apiBaseUrl, locale, setLocale, getString, prefetch],
  );

  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
}
