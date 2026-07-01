import fs from 'node:fs/promises';
import path from 'node:path';
import type { SlideLayoutFile, SlideLayoutLocale } from './slideLayoutTypes.js';
import { clampBox, layoutForLang } from './slideLayoutTypes.js';
import type { SlideLang } from './slideRender.js';
import { isLayoutObjectLabel, layoutObjectLabelPattern } from './slideLayoutObjects.js';

function slideIdFromRel(rel: string): string {
  return path.basename(rel, '.html');
}

function layoutPath(deckRoot: string, rel: string): string {
  return path.join(deckRoot, 'layouts', `${slideIdFromRel(rel)}.json`);
}

export async function readSlideLayoutFile(
  deckRoot: string,
  rel: string,
): Promise<SlideLayoutFile | null> {
  try {
    const raw = await fs.readFile(layoutPath(deckRoot, rel), 'utf8');
    return JSON.parse(raw) as SlideLayoutFile;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

export async function writeSlideLayout(
  deckRoot: string,
  rel: string,
  lang: SlideLang,
  blocks: SlideLayoutLocale,
  labels?: Record<string, string>,
): Promise<void> {
  const dir = path.join(deckRoot, 'layouts');
  await fs.mkdir(dir, { recursive: true });
  const existing = (await readSlideLayoutFile(deckRoot, rel)) ?? { version: 1 as const };
  const next: SlideLayoutFile = {
    version: 1,
    labels: labels ?? existing.labels,
    en: lang === 'en' ? sanitizeBlocks(blocks) : existing.en,
    zh: lang === 'zh' ? sanitizeBlocks(blocks) : existing.zh,
  };
  await fs.writeFile(layoutPath(deckRoot, rel), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

function sanitizeBlocks(blocks: SlideLayoutLocale): SlideLayoutLocale {
  const out: SlideLayoutLocale = {};
  for (const [id, box] of Object.entries(blocks)) {
    out[id] = clampBox(box);
  }
  return out;
}

function isPanelLabel(label: string | undefined): boolean {
  return label === 'left-panel' || label === 'right-panel';
}

export function buildLayoutCss(
  blocks: SlideLayoutLocale,
  labels: Record<string, string> = {},
): string {
  if (Object.keys(blocks).length === 0) return '';
  const rules: string[] = [];
  let hasPanel = false;
  for (const [id, b] of Object.entries(blocks)) {
    const label = labels[id] ?? '';
    if (isPanelLabel(label)) {
      hasPanel = true;
      if (label === 'left-panel') {
        rules.push(
          `[data-kind-block="${id}"]{width:${b.w}%!important;flex:0 0 auto!important;position:relative!important;height:100%!important;left:auto!important;top:auto!important;margin:0!important;}`,
        );
      } else {
        rules.push(
          `[data-kind-block="${id}"]{flex:1 1 0!important;position:relative!important;height:100%!important;left:auto!important;top:auto!important;min-width:0!important;margin:0!important;}`,
        );
      }
    } else {
      rules.push(
        `[data-kind-block="${id}"]{left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%;}`,
      );
    }
  }
  const containerRule = hasPanel
    ? '.kind-layout-active .slide-container{display:flex!important;position:relative!important;height:720px!important;overflow:hidden!important}'
    : '.kind-layout-active .slide-container{display:block!important;position:relative!important}';
  const blockBase = hasPanel
    ? `.kind-layout-active .slide-container>.left-panel,.kind-layout-active .slide-container>.right-panel{box-sizing:border-box!important;overflow:visible!important;z-index:1}`
    : `.kind-layout-active .slide-container [data-kind-block]{position:absolute!important;margin:0!important;box-sizing:border-box!important;overflow:hidden!important;z-index:1}`;
  return `
${containerRule}
${blockBase}
${rules.join('\n')}
`;
}

export const TYPOGRAPHY_CSS = `
.kind-zh-typography .problem-desc,.kind-zh-typography .mission-text,.kind-zh-typography .belief-text,
.kind-zh-typography .problem-title,.kind-zh-typography .summary-label,.kind-zh-typography .subtitle,
.kind-zh-typography .tagline,.kind-zh-typography .footer-text,.kind-zh-typography .slide-md-body p,
.kind-zh-typography .slide-md-body li{
  line-break:strict;word-break:keep-all;text-wrap:balance;line-height:1.62;letter-spacing:0.03em
}
.kind-zh-typography .huge-text,.kind-zh-typography .huge-title,.kind-zh-typography .vision-big{
  text-wrap:balance;line-height:1.08;letter-spacing:0.02em
}
`;

export function injectLayoutProbeScript(): string {
  const allow = layoutObjectLabelPattern();
  return `<script>
(function(){
  var ALLOW=/${allow}/;
  function measure(){
    var slide=document.querySelector('.slide-container');
    if(!slide){parent.postMessage({type:'kind-blocks',blocks:[]},'*');return;}
    var sr=slide.getBoundingClientRect();
    var out=[];
    document.querySelectorAll('[data-kind-block]').forEach(function(el){
      var label=(el.className||'').split(/\\s+/)[0]||'';
      if(!ALLOW.test(label))return;
      var r=el.getBoundingClientRect();
      if(r.width<2||r.height<2)return;
      out.push({
        id:el.getAttribute('data-kind-block'),
        label:label,
        x:((r.left-sr.left)/sr.width)*100,
        y:((r.top-sr.top)/sr.height)*100,
        w:(r.width/sr.width)*100,
        h:(r.height/sr.height)*100
      });
    });
    parent.postMessage({type:'kind-blocks',blocks:out},'*');
  }
  if(document.readyState==='complete')measure();
  else window.addEventListener('load',measure);
})();
</script>`;
}

export async function getLayoutPayload(
  deckRoot: string,
  rel: string,
  lang: SlideLang,
  labelsFromHtml: Record<string, string>,
): Promise<{ blocks: SlideLayoutLocale; labels: Record<string, string> }> {
  const file = await readSlideLayoutFile(deckRoot, rel);
  const saved = layoutForLang(file, lang);
  const labels: Record<string, string> = {};
  const blocks: SlideLayoutLocale = {};
  for (const [id, label] of Object.entries(labelsFromHtml)) {
    if (!isLayoutObjectLabel(label)) continue;
    labels[id] = label;
    if (saved[id]) blocks[id] = saved[id];
  }
  return { blocks, labels };
}

export { clampBox, layoutForLang };
