/**
 * docx-js helpers — DRY wrappers for brand-styled Word documents.
 * See skills/tableai-docx-master/reference.md for units and anti-patterns.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

export const DXA_PER_INCH = 1440;
export const A4_WIDTH = 11906;
export const A4_HEIGHT = 16838;
export const LETTER_WIDTH = 12240;
export const LETTER_HEIGHT = 15840;

/** @param {import('./brand.mjs').BrandTokens} brand */
export function defaultDocumentFonts(brand) {
  return {
    name: brand.fonts.latin,
    eastAsia: brand.fonts.eastAsia,
  };
}

/**
 * Parse inline run DSL: [{ b: 'bold' }, 'plain', { i: 'italic' }]
 * @param {Array<string|Record<string,string>>} parts
 * @param {import('./brand.mjs').BrandTokens} brand
 */
export function runs(parts, brand, base = {}) {
  const font = defaultDocumentFonts(brand);
  return parts.flatMap((part) => {
    if (typeof part === 'string') {
      return [
        new TextRun({
          text: part,
          font,
          size: base.size ?? brand.bodySize,
          color: base.color ?? brand.colors.ink,
          ...base,
        }),
      ];
    }
    const key = Object.keys(part)[0];
    const text = part[key];
    const flags = {
      b: { bold: true },
      i: { italics: true },
      u: { underline: {} },
      gold: { color: brand.colors.gold },
      muted: { color: brand.colors.muted },
    };
    return [
      new TextRun({
        text,
        font,
        size: base.size ?? brand.bodySize,
        color: base.color ?? brand.colors.ink,
        ...base,
        ...(flags[key] ?? {}),
      }),
    ];
  });
}

/** @param {import('./brand.mjs').BrandTokens} brand */
export function P(textOrParts, brand, opts = {}) {
  const children =
    typeof textOrParts === 'string'
      ? [
          new TextRun({
            text: textOrParts,
            font: defaultDocumentFonts(brand),
            size: brand.bodySize,
            color: brand.colors.ink,
          }),
        ]
      : runs(textOrParts, brand);
  return new Paragraph({
    spacing: { after: opts.after ?? 160, line: opts.line ?? 276 },
    alignment: opts.align,
    children,
  });
}

/** @param {import('./brand.mjs').BrandTokens} brand */
export function bulletParagraph(textOrParts, brand, level = 0, numberingRef = 'bullets') {
  const children =
    typeof textOrParts === 'string'
      ? [
          new TextRun({
            text: textOrParts,
            font: defaultDocumentFonts(brand),
            size: brand.bodySize,
            color: brand.colors.ink,
          }),
        ]
      : runs(textOrParts, brand);
  return new Paragraph({
    numbering: { reference: numberingRef, level },
    spacing: { after: 120 },
    children,
  });
}

export function B(textOrParts, brand) {
  return bulletParagraph(textOrParts, brand, 0);
}

export function B2(textOrParts, brand) {
  return bulletParagraph(textOrParts, brand, 1);
}

/** Bullet paragraph with pre-built TextRun children */
export function BRuns(children, _brand, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 120 },
    children,
  });
}

/** @param {import('./brand.mjs').BrandTokens} brand */
export function H1(text, brand) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun({
        text,
        font: defaultDocumentFonts(brand),
        size: brand.headingSizes.h1,
        bold: true,
        color: brand.colors.ink,
      }),
    ],
  });
}

/** @param {import('./brand.mjs').BrandTokens} brand */
export function H2(text, brand) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text,
        font: defaultDocumentFonts(brand),
        size: brand.headingSizes.h2,
        bold: true,
        color: brand.colors.ink,
      }),
    ],
  });
}

/** @param {import('./brand.mjs').BrandTokens} brand */
export function H3(text, brand) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [
      new TextRun({
        text,
        font: defaultDocumentFonts(brand),
        size: brand.headingSizes.h3,
        bold: true,
        color: brand.colors.ink,
      }),
    ],
  });
}

/**
 * Parse **bold** and `code` spans inside a table cell.
 * @param {string} text
 * @param {import('./brand.mjs').BrandTokens} brand
 */
function cellRuns(text, brand, font, isHeader) {
  const size = isHeader ? 20 : brand.bodySize;
  const parts = String(text)
    .split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g)
    .filter(Boolean);
  if (parts.length === 0) {
    return [new TextRun({ text: '', font, size, bold: isHeader, color: brand.colors.ink })];
  }
  return parts.map((part) => {
    const isBold = part.startsWith('**') && part.endsWith('**');
    const isItalic = !isBold && part.length > 2 && part.startsWith('*') && part.endsWith('*');
    const isCode = part.startsWith('`') && part.endsWith('`');
    let t = part;
    if (isBold) t = part.slice(2, -2);
    else if (isItalic) t = part.slice(1, -1);
    else if (isCode) t = part.slice(1, -1);
    return new TextRun({
      text: t,
      font: isCode ? { name: 'Consolas', eastAsia: brand.fonts.eastAsia } : font,
      size,
      bold: isHeader || isBold,
      italics: isItalic || undefined,
      color: brand.colors.ink,
    });
  });
}

/**
 * Table with dual widths enforced (columnWidths + per-cell width).
 * @param {string[][]} rows — first row = header
 * @param {number[]} columnWidthsDxa — must sum to tableWidthDxa
 * @param {import('./brand.mjs').BrandTokens} brand
 */
export function TBL(rows, columnWidthsDxa, brand, tableWidthDxa) {
  const sum = columnWidthsDxa.reduce((a, b) => a + b, 0);
  if (sum !== tableWidthDxa) {
    throw new Error(`TBL: columnWidths sum ${sum} !== tableWidth ${tableWidthDxa}`);
  }
  const font = defaultDocumentFonts(brand);
  const tableRows = rows.map((row, rowIdx) => {
    const isHeader = rowIdx === 0;
    return new TableRow({
      // Keep each row intact across page breaks — a row splitting mid-cell looks
      // unprofessional (and corrupts signature/payment blocks in contracts).
      cantSplit: true,
      // Repeat the header row when a long table does span pages.
      tableHeader: isHeader,
      children: row.map(
        (cellText, colIdx) =>
          new TableCell({
            width: { size: columnWidthsDxa[colIdx], type: WidthType.DXA },
            shading: isHeader
              ? { fill: brand.colors.tableHeaderFill, type: ShadingType.CLEAR, color: 'auto' }
              : { fill: 'FFFFFF', type: ShadingType.CLEAR, color: 'auto' },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: cellRuns(cellText, brand, font, isHeader),
              }),
            ],
          }),
      ),
    });
  });
  return new Table({
    width: { size: tableWidthDxa, type: WidthType.DXA },
    columnWidths: columnWidthsDxa,
    rows: tableRows,
  });
}

/** @param {import('./brand.mjs').BrandTokens} brand */
export function buildStyles(brand) {
  const font = defaultDocumentFonts(brand);
  const ruleColor = brand.headingRule?.color ?? brand.colors.gold ?? brand.colors.accent;
  const goldRule = brand.headingRule?.enabled
    ? {
        bottom: {
          style: BorderStyle.SINGLE,
          size: brand.headingRule.size ?? 6,
          color: ruleColor,
          space: brand.headingRule.space ?? 2,
        },
      }
    : undefined;

  return {
    default: {
      document: {
        run: { font, size: brand.bodySize, color: brand.colors.ink },
        paragraph: { spacing: { after: 160, line: 276 } },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: brand.headingSizes.h1, bold: true, color: brand.colors.ink, font },
        paragraph: {
          spacing: { before: 360, after: 240 },
          outlineLevel: 0,
        },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: brand.headingSizes.h2, bold: true, color: brand.colors.ink, font },
        paragraph: {
          spacing: { before: 220, after: 200 },
          outlineLevel: 1,
          border: goldRule,
        },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        run: { size: brand.headingSizes.h3, bold: true, color: brand.colors.ink, font },
        paragraph: {
          spacing: { before: 180, after: 160 },
          outlineLevel: 2,
        },
      },
    ],
  };
}

/** @param {Record<string, string>} refs — e.g. { bullets: 'bullets', numberedA: 'numA' } */
export function buildNumbering(refs = {}) {
  const configs = [];
  if (refs.bullets !== undefined) {
    configs.push({
      reference: refs.bullets,
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
        {
          level: 1,
          format: LevelFormat.BULLET,
          text: '\u2013',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
        },
      ],
    });
  }
  for (const [key, ref] of Object.entries(refs)) {
    if (key === 'bullets') continue;
    configs.push({
      reference: ref,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
      ],
    });
  }
  return { config: configs };
}

/** @param {import('./brand.mjs').BrandTokens} brand */
function headerRuns(brand) {
  const font = defaultDocumentFonts(brand);
  const headerText = brand.headerText ?? brand.name;
  /** @type {import('docx').IRunOptions[]} */
  const runs = [];

  if (brand.headerWordmark) {
    runs.push(
      new TextRun({
        text: 'Table ',
        font,
        size: 20,
        bold: true,
        color: brand.colors.ink,
      }),
      new TextRun({
        text: 'AI',
        font,
        size: 20,
        bold: true,
        color: brand.colors.accent ?? brand.colors.gold,
      }),
      new TextRun({
        text: '\t',
        font,
        size: 20,
      }),
    );
    const suffix = headerText.replace(/^Table AI\s*[·•]\s*/i, '');
    if (suffix && suffix !== headerText) {
      runs.push(
        new TextRun({
          text: suffix,
          font,
          size: 18,
          color: brand.colors.muted,
        }),
      );
    }
  } else {
    runs.push(
      new TextRun({
        text: headerText,
        font,
        size: 18,
        color: brand.colors.muted,
      }),
    );
  }

  return runs;
}

/** @param {import('./brand.mjs').BrandTokens} brand */
export function headerFooter(brand) {
  const font = defaultDocumentFonts(brand);
  const footerText = brand.footerConfidential ?? '机密';

  return {
    default: {
      header: new Header({
        children: [
          new Paragraph({
            tabStops: [{ type: 'right', position: 9026 }],
            children: headerRuns(brand),
          }),
        ],
      }),
      footer: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${footerText} · 第 `,
                font,
                size: 18,
                color: brand.colors.muted,
              }),
              new TextRun({
                children: [PageNumber.CURRENT],
                font,
                size: 18,
                color: brand.colors.muted,
              }),
              new TextRun({ text: ' 页', font, size: 18, color: brand.colors.muted }),
            ],
          }),
        ],
      }),
    },
  };
}

/**
 * Repeated page/section block factory.
 * @param {{ title: string, kicker?: string, bullets?: string[], body?: string }} page
 * @param {import('./brand.mjs').BrandTokens} brand
 */
export function deckPage(page, brand) {
  const blocks = [];
  if (page.kicker) {
    blocks.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: page.kicker,
            font: defaultDocumentFonts(brand),
            size: 20,
            color: brand.colors.accent ?? brand.colors.gold,
            allCaps: true,
          }),
        ],
      }),
    );
  }
  blocks.push(H2(page.title, brand));
  if (page.body) blocks.push(P(page.body, brand));
  if (page.bullets?.length) {
    for (const b of page.bullets) blocks.push(B(b, brand));
  }
  blocks.push(P('', brand, { after: 280 }));
  return blocks;
}

/**
 * @param {{ brand: import('./brand.mjs').BrandTokens, children: import('docx').FileChild[], title: string }} opts
 */
export function buildDocument({ brand, children, title }) {
  const pageWidth = brand.pageSize === 'letter' ? LETTER_WIDTH : A4_WIDTH;
  const pageHeight = brand.pageSize === 'letter' ? LETTER_HEIGHT : A4_HEIGHT;
  const margin = brand.marginsDxa ?? {
    top: 1440,
    right: 1440,
    bottom: 1440,
    left: 1440,
  };
  const contentWidth = pageWidth - margin.left - margin.right;

  const hf = headerFooter(brand);

  return {
    doc: new Document({
      title,
      creator: brand.name,
      features: { updateFields: true },
      styles: buildStyles(brand),
      numbering: buildNumbering({ bullets: 'bullets', numbered: 'numbered' }),
      sections: [
        {
          properties: {
            page: {
              size: { width: pageWidth, height: pageHeight },
              margin,
            },
          },
          headers: { default: hf.default.header },
          footers: { default: hf.default.footer },
          children,
        },
      ],
    }),
    contentWidthDxa: contentWidth,
  };
}

export { Document, Paragraph, Table, TextRun, WidthType };
