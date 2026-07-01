const BR = '\u27E8BR\u27E9';

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Skip layout-only labels that should not appear in the content editor. */
function isSkippableText(text: string): boolean {
  return /^\[ ERR_\d+ \]$/.test(text) || /^PILLAR\s*\/\//i.test(text) || /^0\d\s*\/\//.test(text);
}

/** Lone glyph on its own line → merge up (avoids wide + orphan “L” wraps in the slide). */
function foldOrphanLines(block: string): string {
  const lines = block.split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const isOrphan =
      trimmed.length === 1 && /[\u4e00-\u9fffA-Za-z0-9]/u.test(trimmed);
    if (isOrphan && out.length > 0) {
      out[out.length - 1] = `${out[out.length - 1]}${trimmed}`;
    } else {
      out.push(line.trimEnd());
    }
  }
  return out.join('\n');
}

/** Trim empty paragraphs; fold single-character orphan lines. */
export function normalizeEditableText(editable: string): string {
  return editable
    .split(/\n\n+/)
    .map((b) => foldOrphanLines(b.trim()))
    .filter(Boolean)
    .join('\n\n');
}

/** Turn slide HTML fragment into plain editable copy (no tags). */
export function htmlToEditable(html: string): string {
  const marked = html.replace(/<br\s*\/?>/gi, BR);
  const chunks: string[] = [];
  const re = />([^<]+)</g;
  let m = re.exec(marked);
  while (m) {
    const raw = m[1].replace(new RegExp(BR, 'g'), '\n').trim();
    if (raw && !isSkippableText(raw)) chunks.push(decodeHtmlEntities(raw));
    m = re.exec(marked);
  }
  return normalizeEditableText(chunks.join('\n\n'));
}

/** Merge edited plain text back into the HTML fragment (structure unchanged). */
export function applyEditableToHtml(html: string, editable: string): string {
  const blocks = normalizeEditableText(editable)
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  let blockIdx = 0;

  const marked = html.replace(/<br\s*\/?>/gi, BR);
  const merged = marked.replace(/>([^<]+)</g, (full, inner: string) => {
    const normalized = inner.replace(new RegExp(BR, 'g'), '\n').trim();
    if (!normalized || isSkippableText(normalized)) return full;
    if (blockIdx >= blocks.length) return full;

    const block = blocks[blockIdx++];
    const lines = block.split('\n');
    const hasBr = inner.includes(BR);
    const newInner =
      hasBr && lines.length > 1
        ? lines.map((line) => escapeHtml(line)).join(BR)
        : escapeHtml(block);

    const lead = inner.match(/^\s*/)?.[0] ?? '';
    const trail = inner.match(/\s*$/)?.[0] ?? '';
    return `>${lead}${newInner}${trail}<`;
  });

  return merged.replace(new RegExp(BR, 'g'), '<br>');
}
