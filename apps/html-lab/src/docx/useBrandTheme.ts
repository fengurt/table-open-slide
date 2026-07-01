import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BrandTokens } from './api';
import { fetchBrandTokens } from './api';

function hexCss(hex: string): string {
  const h = hex.replace(/^#/, '');
  return h.length === 6 ? `#${h}` : hex;
}

/** Map design.md tokens → CSS variables for preview chrome (UI shell stays Atelier). */
export function brandTokensToStyle(tokens: BrandTokens | null): CSSProperties {
  if (!tokens) return {};
  const c = tokens.colors;
  return {
    ['--dl-accent' as string]: hexCss(c.accent || c.gold),
    ['--dl-ink' as string]: hexCss(c.ink),
    ['--dl-muted' as string]: hexCss(c.muted),
    ['--dl-paper' as string]: hexCss(c.paper),
    ['--dl-header-fill' as string]: hexCss(c.tableHeaderFill),
    ['--dl-font-latin' as string]: tokens.fonts.latin,
    ['--dl-font-east' as string]: tokens.fonts.eastAsia,
  };
}

export function useBrandTheme(brandPath: string) {
  const [tokens, setTokens] = useState<BrandTokens | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchBrandTokens(brandPath)
      .then((t) => {
        if (!cancelled) setTokens(t);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e instanceof Error ? e.message : e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [brandPath]);

  return { tokens, loading, error, style: brandTokensToStyle(tokens) };
}
