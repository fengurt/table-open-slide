import { updatePreviewTuneCss } from '../htmlTune';
import type { HtmlTemplate } from '../templateRegistry';
import { measurePreviewLayout } from './measureLayout';

/** Keys reduced first when content overflows (least visual impact → most). */
const SHRINK_ORDER = [
  'main-gap',
  'col-pad',
  'header-py',
  'main-py',
  'main-px',
  'header-px',
  'intro-size',
  'body-size',
] as const;

export type AutoLayoutResult = {
  params: Record<string, number>;
  iterations: number;
  resolved: boolean;
};

function cloneParams(template: HtmlTemplate, base: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of template.params) {
    out[p.key] = base[p.key] ?? p.default;
  }
  return out;
}

function stepDown(template: HtmlTemplate, params: Record<string, number>, key: string): boolean {
  const def = template.params.find((p) => p.key === key);
  if (!def) return false;
  const current = params[key] ?? def.default;
  if (current <= def.min) return false;
  const delta = key.includes('size') ? def.step : 1;
  params[key] = Math.max(def.min, Number((current - delta).toFixed(2)));
  return true;
}

/**
 * Iteratively tightens tune params until slide/column overflow clears or mins are hit.
 * Requires iframe with html-lab bridge loaded (template pages).
 */
export async function autoOptimizeLayout(
  iframe: HTMLIFrameElement,
  template: HtmlTemplate,
  startParams: Record<string, number>,
  maxIterations = 96,
): Promise<AutoLayoutResult> {
  const params = cloneParams(template, startParams);
  const win = iframe.contentWindow;
  const doc = iframe.contentDocument;
  if (!win || !doc) {
    return { params, iterations: 0, resolved: false };
  }

  let iterations = 0;
  let resolved = false;

  for (; iterations < maxIterations; iterations++) {
    updatePreviewTuneCss(doc, template, params);
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    const measure = await measurePreviewLayout(iframe);
    if (!measure.overflow) {
      resolved = true;
      break;
    }

    let stepped = false;
    for (const key of SHRINK_ORDER) {
      if (stepDown(template, params, key)) {
        stepped = true;
        break;
      }
    }
    if (!stepped) break;
  }

  return { params, iterations, resolved };
}
