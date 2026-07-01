import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

export function mdToSanitizedFragment(markdown: string): string {
  const raw = md.render(markdown);
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}

export function wrapMdPreviewDocument(innerHtml: string): string {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body{margin:0;font:15px/1.65 system-ui,-apple-system,'Segoe UI',sans-serif;color:#0a0f1a;background:#fafbff;}
.prose{max-width:42rem;margin:0 auto;padding:20px;}
.prose h1,.prose h2,.prose h3{margin:1.1em 0 0.45em;font-weight:650}
.prose p{margin:0.55em 0}
.prose ul,.prose ol{padding-left:1.35em}
.prose code{font:0.9em ui-monospace,Menlo,monospace;background:rgba(0,0,0,.06);padding:2px 5px;border-radius:4px;}
.prose pre{background:#0c1220;color:#e8ecff;padding:12px 14px;border-radius:8px;overflow:auto}
.prose pre code{background:transparent;padding:0;color:inherit}
.prose table{border-collapse:collapse;width:100%;font-size:14px;margin:12px 0}
.prose th,.prose td{border:1px solid #dbe3f0;padding:8px;vertical-align:top}
.prose a{color:#2856d8}
</style></head><body><div class="prose">${innerHtml}</div></body></html>`;
}
