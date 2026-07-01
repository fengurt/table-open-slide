import TurndownService from 'turndown';
import { htmlToLinkedMarkdown } from './moduleMarkdown';

/** Strip chrome that does not belong in Markdown; convert body to GFM-ish MD. */
export function htmlToMarkdown(html: string): string {
  return htmlToLinkedMarkdown(html);
}

/** @deprecated use htmlToMarkdown */
export function htmlToMarkdownLegacy(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  for (const el of body.querySelectorAll('script,style,link[rel="stylesheet"],noscript')) {
    el.remove();
  }
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  });
  return td.turndown(body);
}
