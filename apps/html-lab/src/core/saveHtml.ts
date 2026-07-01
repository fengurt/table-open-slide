export async function saveRawHtml(path: string, html: string): Promise<void> {
  const r = await fetch(`/api/raw-html?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html,
  });
  if (!r.ok) throw new Error(await r.text());
}
