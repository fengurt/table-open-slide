#!/usr/bin/env node
/**
 * Generate guizang Atelier slide <section> blocks via Tongyi (OpenAI-compatible).
 *
 * Usage:
 *   source ~/.cursor/skills/ali-tongyi/scripts/load_key.sh
 *   export DOCX_MASTER_AI_API_KEY="$DASHSCOPE_API_KEY"
 *   export DOCX_MASTER_AI_BASE_URL="https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1"
 *   export DOCX_MASTER_AI_MODEL="qwen3.7-max"
 *   node scripts/generate-guizang-deck-tongyi.mjs \
 *     --brief /path/to/brief.md \
 *     --out slides/projects/jindou-corporate/deck/index.html \
 *     --slides 12
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatCompletionsWithFallback } from '../skills/tableai-docx-master/lib/llm-router.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function resolveRepoPath(p) {
  return path.isAbsolute(p) ? p : path.join(REPO, p);
}

function findDefaultBrief() {
  const candidates = [
    'slides/projects/jindou-corporate/brief.md',
    'slides/projects/jindou-corporate/金豆投资控股集团_PPT设计任务书.md',
    '/Users/af/Downloads/金豆投资控股集团_PPT设计任务书.md',
  ];
  return candidates.find((p) => fs.existsSync(resolveRepoPath(p))) ?? candidates[0];
}

const briefPath = arg('--brief', findDefaultBrief());
const outPath = arg('--out', 'slides/projects/jindou-corporate/deck/index.html');
const slideCount = Number(arg('--slides', '12'));
const dryRun = process.argv.includes('--dry-run');
const showcasePath = path.join(
  REPO,
  'skills/tableai-guizang-ppt-skill/demo/atelier-showcase/index.html',
);
const templatePath = path.join(REPO, 'skills/tableai-guizang-ppt-skill/assets/template-atelier.html');

if (!Number.isInteger(slideCount) || slideCount < 1 || slideCount > 60) {
  console.error('[tongyi] --slides must be an integer from 1 to 60');
  process.exit(1);
}

const absBriefPath = resolveRepoPath(briefPath);
if (!fs.existsSync(absBriefPath)) {
  console.error('[tongyi] Brief not found:', absBriefPath);
  console.error('[tongyi] Pass --brief /path/to/金豆投资控股集团_PPT设计任务书.md');
  process.exit(1);
}

const brief = fs.readFileSync(absBriefPath, 'utf8');
const showcase = fs.readFileSync(showcasePath, 'utf8');
const template = fs.existsSync(path.join(REPO, outPath))
  ? fs.readFileSync(path.join(REPO, outPath), 'utf8')
  : fs.readFileSync(templatePath, 'utf8');

const exampleMatch = showcase.match(
  /<section class="slide dark hero"[\s\S]*?<\/section>\s*<section class="slide dark"[\s\S]*?<\/section>\s*<section class="slide dark hero"[\s\S]*?quote[\s\S]*?<\/section>/,
);
const examples = exampleMatch?.[0] ?? showcase.slice(showcase.indexOf('<section'), showcase.indexOf('<section') + 4000);

const system = `You are an expert guizang-ppt-skill author for Style C · Atelier (deep navy + gold).
Output ONLY raw HTML: exactly ${slideCount} consecutive <section class="slide ...">...</section> blocks.
No markdown fences, no commentary, no <!DOCTYPE>, no <style>, no <script>.

Rules:
- Match the example structure: slide-head/slide-num, frame variants (hero-stage, act-stage, stat-stage, quote-stage, frame-main, case-split, pipe-stage), slide-foot/slide-module
- Required attrs: class="slide {dark|light} [hero]", data-theme, data-module, data-page="N", data-animate (hero|cascade|quote|directional|pipeline)
- Use data-anim on animated inner elements
- Colors in copy only; CSS is in template (:root --ink #1E3A5F, --gold #B8963E)
- Chinese primary + English subtitles where brief suggests
- Use real data from the brief; do not invent client logos
- Vary layouts across pages (hero, act, stat, dual-grid, quote, ba-grid, pipe-step, case-split)
- data-module groups: overview (1-6), portfolio (7-10), honors (11), outro (12)`;

const user = `# Design brief (source of truth)

${brief.slice(0, 28000)}

# Example slide HTML (format only — do not copy content)

${examples}

# Task

Generate ${slideCount} slides for 金豆投资控股集团 corporate profile test deck:
- P1 Cover, P2 TOC (4 chapters), P3 集团寄语, P4 企业概况 (140亿+ etc), P5 发展历程 timeline highlight, P6 核心数据仪表盘, P7 八大产业 overview
- P9 启星铝业实力, P10 启星全球市场 50%/90%, P14 恐龙王国 133.7万+游客
- P21 荣誉墙 or P23 未来战略, P24 封底

Map to ${slideCount} pages total. Number data-page 1..${slideCount}, slide-num 001..${String(slideCount).padStart(3, '0')}.`;

if (dryRun) {
  console.log('[tongyi] Dry run ok');
  console.log('[tongyi] Brief:', absBriefPath);
  console.log('[tongyi] Output:', path.join(REPO, outPath));
  console.log('[tongyi] Slides:', slideCount);
  console.log('[tongyi] Prompt chars:', system.length + user.length);
  process.exit(0);
}

console.log('[tongyi] Calling LLM…', process.env.DOCX_MASTER_AI_MODEL ?? '(router default)');

const result = await chatCompletionsWithFallback({
  messages: [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ],
  temperature: 0.35,
});

if (!result.ok) {
  console.error('[tongyi] Failed:', result.error);
  process.exit(1);
}

console.log('[tongyi] Model:', result.model, '| Provider:', result.provider);

let html = result.content.trim();
html = html.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '');

const sections = html.match(/<section[\s\S]*?<\/section>/gi);
if (!sections?.length) {
  console.error('[tongyi] No <section> blocks in response. First 500 chars:\n', html.slice(0, 500));
  process.exit(1);
}

console.log('[tongyi] Parsed', sections.length, 'sections');
if (sections.length !== slideCount) {
  console.error(`[tongyi] Expected ${slideCount} sections, got ${sections.length}`);
  process.exit(1);
}

const issues = [];
for (const [index, section] of sections.entries()) {
  const page = String(index + 1);
  const padded = page.padStart(3, '0');
  if (!section.includes(`data-page="${page}"`)) issues.push(`slide ${page}: missing data-page="${page}"`);
  if (!section.includes(`<span class="slide-num">${padded}</span>`)) {
    issues.push(`slide ${page}: missing slide-num ${padded}`);
  }
  if (!/data-module="[^"]+"/.test(section)) issues.push(`slide ${page}: missing data-module`);
  if (!/data-animate="[^"]+"/.test(section)) issues.push(`slide ${page}: missing data-animate`);
}
if (issues.length > 0) {
  console.error('[tongyi] Generated slide validation failed:');
  for (const issue of issues) console.error(' -', issue);
  process.exit(1);
}

const slidesBlock = sections.join('\n');
const startMarker = '<!-- ============================================================\n     SLIDES 插入区';
const endMarker = '</div>\n\n<div id="nav"></div>';

const startIdx = template.indexOf(startMarker);
const endIdx = template.indexOf(endMarker, startIdx);
if (startIdx < 0 || endIdx < 0) {
  console.error('[tongyi] Template markers not found');
  process.exit(1);
}

const before = template.slice(0, startIdx);
const after = template.slice(endIdx);
const headerComment = `<!-- ============================================================
     SLIDES 插入区 · Tongyi ${result.model} · ${new Date().toISOString()}
     Source: ${path.basename(absBriefPath)}
     ============================================================ -->

`;

const merged =
  before +
  headerComment +
  slidesBlock +
  '\n\n' +
  after.replace(/^<\/div>\n\n/, '');

const title = '金豆投资控股集团 · Corporate Profile · Tongyi Generated';
const finalHtml = merged.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

const absOut = path.join(REPO, outPath);
fs.mkdirSync(path.dirname(absOut), { recursive: true });
fs.writeFileSync(absOut, finalHtml, 'utf8');
console.log('[tongyi] Wrote', absOut, `(${sections.length} slides)`);

const manifestPath = path.join(REPO, path.dirname(outPath), '../manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.slideCount = sections.length;
  manifest.generatedAt = new Date().toISOString();
  manifest.description = `Tongyi ${result.model} generated from ${path.basename(absBriefPath)}`;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log('[tongyi] Updated', manifestPath);
}
