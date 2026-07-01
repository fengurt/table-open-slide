import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cn2num } from './cn2num.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_MD = path.resolve(
  __dirname,
  '../../slides/projects/2day_FB_Profit2chain/600p_slides.md',
);

function field(block, label) {
  const re = new RegExp(`${label}[：:]\\s*([\\s\\S]*?)(?=\\n[^\\n]+[：:]|$)`, 'm');
  const m = block.match(re);
  return m?.[1]?.trim() ?? '';
}

function splitSubPages(start, end, block, headline) {
  if (start === end) {
    return [{ page: start, title: headline, block }];
  }
  const out = [];
  const re = /第([一二三四五六七八九十\d]+)页[：:，,、]?([^第\n]{4,}?)(?=第[一二三四五六七八九十\d]+页|$)/g;
  const hits = [...block.matchAll(re)];
  if (hits.length >= end - start + 1) {
    for (const h of hits) {
      const p = cn2num(h[1]);
      if (p >= start && p <= end) {
        out.push({ page: p, title: h[2].trim().slice(0, 40) || headline, block: h[2] });
      }
    }
  }
  if (out.length === end - start + 1) return out;
  for (let p = start; p <= end; p++) {
    out.push({
      page: p,
      title: `${headline}（${p - start + 1}/${end - start + 1}）`,
      block,
    });
  }
  return out;
}

function protoToLayout(proto) {
  const p = proto || '';
  if (/^hero-cover|^stat-hero|^dual-stat|^before-after|^quote|^pipeline|^action|^flash|^split-text|^act-divider/.test(p)) {
    return p.split(/[\s·]/)[0];
  }
  if (/全屏|封面|主视觉/.test(p)) return 'hero-cover';
  if (/数据|数字|百分比|大屏/.test(p)) return 'stat-hero';
  if (/对比|左右|Before|前后/.test(p)) return 'before-after';
  if (/金句|引用|居中/.test(p)) return 'quote';
  if (/流程|漏斗|步进|管道/.test(p)) return 'pipeline';
  if (/互动|举手|计时|清单|实操/.test(p)) return 'action';
  if (/闪频|快切|案例流/.test(p)) return 'flash';
  if (/分栏|图文|左文右图/.test(p)) return 'split-text';
  if (/模块|幕间|分隔/.test(p)) return 'act-divider';
  return 'structure';
}

export function parseMd(md) {
  const map = new Map();
  const re =
    /第([\u4e00-\u9fa50-9]+)页(?:至第([\u4e00-\u9fa50-9]+)页)?[：:]([^\n]+)\n([\s\S]*?)(?=\n第[\u4e00-\u9fa50-9]+页|\n模块|\n为严格|\n## 视觉流|$)/g;
  let m = re.exec(md);
  while (m !== null) {
    const start = cn2num(m[1]);
    const end = m[2] ? cn2num(m[2]) : start;
    const headline = m[3].trim();
    const block = m[4] ?? '';
    const base = {
      grain: field(block, '颗粒度属性'),
      pace: field(block, '时间轴配速'),
      prototype: field(block, '空间轴原型'),
      visual: field(block, 'PPT视觉设计'),
      notes: field(block, '背后支持信息与场控指令'),
      script: field(block, '讲师逐字稿'),
    };
    const layout = protoToLayout(base.prototype);
    for (const sub of splitSubPages(start, end, block, headline)) {
      map.set(sub.page, {
        ...base,
        page: sub.page,
        title: sub.title,
        layout,
        kicker: field(sub.block, '颗粒度属性') || base.grain.split('·')[0]?.trim() || headline,
      });
    }
    m = re.exec(md);
  }
  return map;
}

export async function loadParsedMd(mdPath = DEFAULT_MD) {
  try {
    const md = await fs.readFile(mdPath, 'utf8');
    if (!md.trim()) return new Map();
    return parseMd(md);
  } catch {
    return new Map();
  }
}
