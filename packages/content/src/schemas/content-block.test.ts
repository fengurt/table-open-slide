import { describe, expect, it } from 'vitest';
import { contentBlockSchema } from './content-block';

describe('contentBlockSchema', () => {
  it('accepts a full locale map', () => {
    const parsed = contentBlockSchema.parse({
      key: 'test.key',
      body: {
        en: 'Hello',
        'zh-CN': '你好',
        'zh-TW': '你好',
        ja: 'こんにちは',
      },
    });
    expect(parsed.key).toBe('test.key');
    expect(parsed.body.en).toBe('Hello');
  });
});
