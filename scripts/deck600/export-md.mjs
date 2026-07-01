#!/usr/bin/env node
/** Export page-specs → slides/projects/.../600p_slides.md */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { num2cn } from './cn2num.mjs';
import { enrichTeaching } from './enrich-spec.mjs';
import { DEFAULT_MD } from './parse-md.mjs';
import { getAllTeachingSpecs, getVisualStreamMdSection } from './page-specs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function block(page) {
  const lines = [
    `第${num2cn(page.page)}页：${page.title}`,
    `颗粒度属性：${page.grain || '标准教学页'}`,
    `时间轴配速：${page.pace || '推演流'}`,
    `空间轴原型：${page.prototype || page.layout || 'structure'}`,
    `PPT视觉设计：${page.visual || ''}`,
    `背后支持信息与场控指令：${page.notes || ''}`,
    `讲师逐字稿：${page.script || ''}`,
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const specs = getAllTeachingSpecs().map((p) => enrichTeaching(p));
  const parts = [
    '# 餐饮单店盈利实战 · 600 页课件颗粒度规格',
    '',
    '## 课程总览',
    '两天闭门工坊 · 从活下去到可复制 · 盈利模型 × 产品结构 × 连锁种子',
    '',
    '---',
    '',
  ];
  let mod = '';
  for (const p of specs) {
    if (p.moduleTitle && p.moduleTitle !== mod) {
      mod = p.moduleTitle;
      parts.push(`## ${mod}`, '');
    }
    parts.push(block(p));
  }
  parts.push('---', '', '## 视觉流（第139–600页）', '', getVisualStreamMdSection(), '');
  await fs.writeFile(DEFAULT_MD, parts.join('\n'), 'utf8');
  console.log(`✓ exported ${specs.length} teaching pages → ${DEFAULT_MD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
