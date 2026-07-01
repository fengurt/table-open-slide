/**
 * Parse vendored brand design.md → docx-js tokens.
 * Schema: skills/tableai-docx-master/SKILL.md § Brand design.md
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULTS = {
  name: 'Brand',
  pageSize: 'a4',
  bodySize: 22,
  headingSizes: { h1: 32, h2: 27, h3: 24 },
  colors: {
    ink: '1A1A1A',
    gold: 'B89B6E',
    accent: 'B89B6E',
    muted: '666666',
    paper: 'FFFFFF',
    tableHeaderFill: 'F4F1EA',
  },
  fonts: { latin: 'Calibri', eastAsia: 'Microsoft YaHei' },
  headingRule: { enabled: true, size: 6, space: 2 },
  marginsDxa: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
};

/** @typedef {typeof DEFAULTS & { headerText?: string, footerConfidential?: string, voice?: string, headerWordmark?: boolean, logoFile?: string }} BrandTokens */

/**
 * @param {string} designPath
 * @returns {Promise<BrandTokens>}
 */
export async function loadBrand(designPath) {
  const abs = path.resolve(designPath);
  const raw = await fs.readFile(abs, 'utf8');
  return parseDesignMd(raw, path.basename(path.dirname(abs)));
}

/**
 * @param {string} raw
 * @param {string} fallbackName
 * @returns {BrandTokens}
 */
export function parseDesignMd(raw, fallbackName = 'Brand') {
  /** @type {BrandTokens} */
  const tokens = structuredClone(DEFAULTS);
  tokens.name = fallbackName;

  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^(\w[\w-]*):\s*(.+)$/);
      if (!m) continue;
      const [, key, val] = m;
      const v = val.trim().replace(/^["']|["']$/g, '');
      if (key === 'name') tokens.name = v;
      if (key === 'pageSize') tokens.pageSize = v.toLowerCase();
    }
  }

  const section = (title) => {
    const re = new RegExp(`##\\s+${title}[\\s\\S]*?(?=\\n##\\s|$)`, 'i');
    const m = raw.match(re);
    return m ? m[0] : '';
  };

  const kv = (block, key) => {
    const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'im'));
    return m ? m[1].trim().replace(/^#|#/g, '').replace(/\s/g, '') : null;
  };

  const colorsBlock = section('Colors') || section('颜色');
  if (colorsBlock) {
    for (const k of ['ink', 'gold', 'accent', 'muted', 'paper', 'tableHeaderFill']) {
      const v = kv(colorsBlock, k);
      if (v) tokens.colors[k] = v.replace('#', '').toUpperCase();
    }
    if (!tokens.colors.accent) tokens.colors.accent = tokens.colors.gold;
  }

  const fontsBlock = section('Fonts') || section('字体');
  if (fontsBlock) {
    const latin = kv(fontsBlock, 'latin');
    const eastAsia = kv(fontsBlock, 'eastAsia') || kv(fontsBlock, 'east-asia') || kv(fontsBlock, 'cjk');
    if (latin) tokens.fonts.latin = latin;
    if (eastAsia) tokens.fonts.eastAsia = eastAsia;
  }

  const typeBlock = section('Typography') || section('排版');
  if (typeBlock) {
    const body = kv(typeBlock, 'bodySize') || kv(typeBlock, 'body');
    const h1 = kv(typeBlock, 'h1');
    const h2 = kv(typeBlock, 'h2');
    const h3 = kv(typeBlock, 'h3');
    if (body) tokens.bodySize = Number.parseInt(body, 10);
    if (h1) tokens.headingSizes.h1 = Number.parseInt(h1, 10);
    if (h2) tokens.headingSizes.h2 = Number.parseInt(h2, 10);
    if (h3) tokens.headingSizes.h3 = Number.parseInt(h3, 10);
  }

  const chromeBlock = section('Chrome') || section('页眉页脚');
  if (chromeBlock) {
    tokens.headerText = kv(chromeBlock, 'header') ?? tokens.headerText;
    tokens.footerConfidential = kv(chromeBlock, 'footer') ?? tokens.footerConfidential;
    if (/wordmark:\s*true/i.test(chromeBlock)) tokens.headerWordmark = true;
    const logo = kv(chromeBlock, 'logo');
    if (logo) tokens.logoFile = logo;
  }

  const voiceBlock = section('Voice') || section('语气');
  if (voiceBlock) {
    tokens.voice = voiceBlock.replace(/^##[^\n]+\n?/i, '').trim();
  }

  const ruleBlock = section('Heading rule') || section('标题规则');
  if (ruleBlock) {
    if (/disabled|false|off/i.test(ruleBlock)) tokens.headingRule.enabled = false;
    const size = kv(ruleBlock, 'size');
    if (size) tokens.headingRule.size = Number.parseInt(size, 10);
    const ruleColor = kv(ruleBlock, 'color');
    if (ruleColor === 'accent' && tokens.colors.accent) {
      tokens.headingRule.color = tokens.colors.accent;
    }
  }
  if (!tokens.headingRule.color) tokens.headingRule.color = tokens.colors.gold;

  return tokens;
}
