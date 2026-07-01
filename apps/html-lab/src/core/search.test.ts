import { describe, expect, it } from 'vitest';
import { scorePath, searchHtmlItems } from './search';
import type { HtmlItem } from './types';

const items: HtmlItem[] = [
  {
    path: 'slides/projects/jindou-corporate/deck/index.html',
    mtimeMs: 300,
    size: 1024,
  },
  {
    path: 'landing01/dong/dongreport20260525.html',
    mtimeMs: 200,
    size: 2048,
  },
  {
    path: 'slides/projects/tongyi-online-test/deck/index.html',
    mtimeMs: 100,
    size: 4096,
  },
];

describe('html-lab search', () => {
  it('matches Chinese aliases against romanized project paths', () => {
    expect(scorePath('金豆', 'slides/projects/jindou-corporate/deck/index.html')).toBeGreaterThan(0);
    expect(searchHtmlItems(items, '金豆')[0]?.path).toBe(
      'slides/projects/jindou-corporate/deck/index.html',
    );
  });

  it('supports mixed alias and path-token searches', () => {
    expect(searchHtmlItems(items, '通义 deck')[0]?.path).toBe(
      'slides/projects/tongyi-online-test/deck/index.html',
    );
  });

  it('keeps recency ordering for an empty query', () => {
    expect(searchHtmlItems(items, '').map((item) => item.path)).toEqual([
      'slides/projects/jindou-corporate/deck/index.html',
      'landing01/dong/dongreport20260525.html',
      'slides/projects/tongyi-online-test/deck/index.html',
    ]);
  });
});
