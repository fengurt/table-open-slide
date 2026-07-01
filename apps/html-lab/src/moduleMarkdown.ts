import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import TurndownService from 'turndown';

const MARKER = /^<!-- @hl (\d+) (\w+) -->$/;
const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true });

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
});

turndown.addRule('strong', {
  filter: ['strong', 'b'],
  replacement: (content) => (content.trim() ? `**${content}**` : ''),
});

export type ModuleBlock = { index: number; moduleId: string; markdown: string };

export function hasModuleMarkers(markdown: string): boolean {
  return /<!-- @hl \d+ \w+ -->/.test(markdown);
}

export function countModuleNodes(html: string): number {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.querySelectorAll('[data-hl-module]').length;
}

/** HTML → module-annotated Markdown (document order). */
export function htmlToModuleMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = doc.querySelectorAll('[data-hl-module]');
  if (nodes.length === 0) return '';

  const parts: string[] = [];
  nodes.forEach((el, index) => {
    const moduleId = el.getAttribute('data-hl-module') ?? 'block';
    const inner = turndown.turndown(el.innerHTML).trim();
    parts.push(`<!-- @hl ${index} ${moduleId} -->\n${inner}`);
  });
  return `${parts.join('\n\n')}\n`;
}

export function parseModuleMarkdown(markdown: string): ModuleBlock[] {
  const lines = markdown.split('\n');
  const blocks: ModuleBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const match = lines[i]?.match(MARKER);
    if (!match) {
      i++;
      continue;
    }
    const index = Number(match[1]);
    const moduleId = match[2];
    i++;
    const body: string[] = [];
    while (i < lines.length && !MARKER.test(lines[i] ?? '')) {
      body.push(lines[i] ?? '');
      i++;
    }
    blocks.push({ index, moduleId, markdown: body.join('\n').trim() });
  }
  return blocks.sort((a, b) => a.index - b.index);
}

function mdFragmentToHtml(markdown: string): string {
  const raw = md.render(markdown);
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}

/** Apply module Markdown blocks onto matching `[data-hl-module]` nodes. */
export function applyModuleMarkdownToHtml(html: string, markdown: string): string {
  const blocks = parseModuleMarkdown(markdown);
  if (blocks.length === 0) {
    throw new Error('Markdown missing <!-- @hl N id --> markers. Click "From HTML" to regenerate.');
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const nodes = doc.querySelectorAll('[data-hl-module]');

  if (blocks.length !== nodes.length) {
    throw new Error(
      `Module count mismatch: ${blocks.length} markdown blocks vs ${nodes.length} HTML modules.`,
    );
  }

  blocks.forEach((block, i) => {
    const el = nodes[i];
    if (!el) return;
    const expectedId = el.getAttribute('data-hl-module');
    if (expectedId !== block.moduleId) {
      throw new Error(
        `Module order mismatch at #${i}: expected "${expectedId}", got "${block.moduleId}".`,
      );
    }
    el.innerHTML = mdFragmentToHtml(block.markdown);
  });

  const serialized = doc.documentElement.outerHTML;
  return html.trimStart().toLowerCase().startsWith('<!doctype')
    ? `<!DOCTYPE html>\n${serialized}`
    : serialized;
}

/** Pick module-aware or full-body conversion. */
export function htmlToLinkedMarkdown(html: string): string {
  if (countModuleNodes(html) > 0) {
    const modular = htmlToModuleMarkdown(html);
    if (modular) return modular;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const el of doc.body.querySelectorAll('script,style,link[rel="stylesheet"],noscript')) {
    el.remove();
  }
  return turndown.turndown(doc.body);
}
