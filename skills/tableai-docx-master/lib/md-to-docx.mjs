/**
 * Markdown → docx-js blocks (headings, paragraphs, tables, lists).
 */
import { Paragraph, TextRun } from 'docx';

/**
 * Parse **bold** inline segments.
 * @param {string} text
 * @param {import('./brand.mjs').BrandTokens} brand
 */
export function parseInlineRuns(text, brand) {
  const font = { name: brand.fonts.latin, eastAsia: brand.fonts.eastAsia };
  // Order matters: **bold** is matched before *italic* so the leading `**`
  // isn't mistaken for an italic opener. `[^*]+` keeps each span from crossing
  // into an adjacent marker.
  const parts = String(text)
    .split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g)
    .filter(Boolean);
  if (parts.length === 0) {
    return [new TextRun({ text: '', font, size: brand.bodySize, color: brand.colors.ink })];
  }
  return parts.map((part) => {
    const bold = part.startsWith('**') && part.endsWith('**');
    const italic = !bold && part.length > 2 && part.startsWith('*') && part.endsWith('*');
    const code = part.startsWith('`') && part.endsWith('`');
    let t = part;
    if (bold) t = part.slice(2, -2);
    else if (italic) t = part.slice(1, -1);
    else if (code) t = part.slice(1, -1);
    return new TextRun({
      text: t,
      font: code ? { name: 'Consolas', eastAsia: brand.fonts.eastAsia } : font,
      size: brand.bodySize,
      color: brand.colors.ink,
      bold: bold || undefined,
      italics: italic || undefined,
    });
  });
}

function isTableRow(line) {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function isTableSep(line) {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function parseTableRow(line) {
  return line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim());
}

/**
 * @param {string} md
 * @param {typeof import('./docx-helpers.mjs')} h
 * @param {import('./brand.mjs').BrandTokens} brand
 * @param {number} contentWidthDxa
 */
export function markdownToBlocks(md, h, brand, contentWidthDxa) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  /** @type {import('docx').FileChild[]} */
  const blocks = [];
  let i = 0;
  // Each ordered list gets its own numbering instance so a later list restarts
  // at 1 instead of continuing the previous list's count. A blank line between
  // items does not break a list; any other content block does.
  let numberedInstance = 0;
  let lastWasNumbered = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const wasNumbered = lastWasNumbered;
    lastWasNumbered = false;

    if (trimmed === '---') {
      blocks.push(h.P('', brand, { after: 200 }));
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      i++;
      const code = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const font = { name: 'Consolas', eastAsia: brand.fonts.eastAsia };
      for (const codeLine of code) {
        blocks.push(
          new Paragraph({
            spacing: { after: 0, line: 240 },
            shading: { type: 'clear', color: 'auto', fill: brand.colors.tableHeaderFill },
            indent: { left: 180, right: 180 },
            children: [
              new TextRun({
                text: codeLine || ' ',
                font,
                size: Math.max(16, brand.bodySize - 4),
                color: brand.colors.ink,
              }),
            ],
          }),
        );
      }
      blocks.push(h.P('', brand, { after: 160 }));
      continue;
    }

    if (isTableRow(trimmed) && i + 1 < lines.length && isTableSep(lines[i + 1].trim())) {
      const header = parseTableRow(trimmed);
      i += 2;
      const rows = [header];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(parseTableRow(lines[i].trim()));
        i++;
      }
      const cols = header.length;
      const colW = Math.floor(contentWidthDxa / cols);
      const widths = Array.from({ length: cols }, (_, idx) =>
        idx === cols - 1 ? contentWidthDxa - colW * (cols - 1) : colW,
      );
      blocks.push(h.TBL(rows, widths, brand, contentWidthDxa));
      blocks.push(h.P('', brand, { after: 120 }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push(h.H1(trimmed.slice(2).trim().replace(/\*\*/g, ''), brand));
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(h.H2(trimmed.slice(3).trim().replace(/\*\*/g, ''), brand));
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(h.H3(trimmed.slice(4).trim().replace(/\*\*/g, ''), brand));
      i++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const content = trimmed.replace(/^>\s?/, '');
      if (!content) {
        // Lone `>` blockquote separator line — emit nothing.
        i++;
        continue;
      }
      const quotedHeading = content.match(/^(#{1,6})\s+(.*)$/);
      if (quotedHeading) {
        // A heading nested inside a blockquote (e.g. `> ## 终章`) renders as a
        // bold callout title rather than literal `##` text.
        blocks.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { before: 200, after: 120, line: 276 },
            children: [
              new TextRun({
                text: quotedHeading[2].replace(/\*\*/g, ''),
                font: {
                  name: brand.fonts.latin,
                  eastAsia: brand.fonts.headingEastAsia ?? brand.fonts.eastAsia,
                },
                size: brand.headingSizes.h3,
                bold: true,
                color: brand.colors.ink,
              }),
            ],
          }),
        );
      } else {
        blocks.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 160, line: 276 },
            children: parseInlineRuns(content, brand),
          }),
        );
      }
      i++;
      continue;
    }

    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch) {
      const level = bulletMatch[1].length >= 2 ? 1 : 0;
      const content = bulletMatch[2].trim();
      // GitHub task-list items render as a checkbox glyph + text, not a bullet.
      const task = content.match(/^\[([ xX])\]\s+(.*)$/);
      if (task) {
        const box = task[1] === ' ' ? '☐' : '☑';
        blocks.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 80, line: 276 },
            children: [
              new TextRun({
                text: `${box}  `,
                font: { name: brand.fonts.latin, eastAsia: brand.fonts.eastAsia },
                size: brand.bodySize,
                color: brand.colors.accent ?? brand.colors.gold,
              }),
              ...parseInlineRuns(task[2], brand),
            ],
          }),
        );
        i++;
        continue;
      }
      blocks.push(h.BRuns(parseInlineRuns(content, brand), brand, level));
      i++;
      continue;
    }

    if (/^[—–-]\s/.test(trimmed) || trimmed.startsWith('—')) {
      const content = trimmed.replace(/^[—–-]\s*/, '');
      blocks.push(h.BRuns(parseInlineRuns(content, brand), brand, 1));
      i++;
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (!wasNumbered) numberedInstance += 1;
      blocks.push(
        new Paragraph({
          numbering: { reference: 'numbered', level: 0, instance: numberedInstance },
          spacing: { after: 120 },
          children: parseInlineRuns(numMatch[2], brand),
        }),
      );
      lastWasNumbered = true;
      i++;
      continue;
    }

    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      blocks.push(
        new Paragraph({
          spacing: { before: 240, after: 160 },
          alignment: 'center',
          children: [
            new TextRun({
              text: trimmed.slice(1, -1),
              font: { name: brand.fonts.latin, eastAsia: brand.fonts.eastAsia },
              size: 20,
              color: brand.colors.muted,
              italics: true,
            }),
          ],
        }),
      );
      i++;
      continue;
    }

    blocks.push(
      new Paragraph({
        spacing: { after: 160, line: 276 },
        children: parseInlineRuns(trimmed, brand),
      }),
    );
    i++;
  }

  return blocks;
}

/**
 * @param {string} mdPath
 * @param {string} raw
 */
export function metaFromMarkdown(raw) {
  const firstLine = raw.split('\n').find((l) => l.startsWith('# '));
  const title = firstLine ? firstLine.slice(2).trim() : 'Document';
  const slug = title
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
    .toLowerCase();
  return {
    title,
    filename: slug || 'document',
  };
}
