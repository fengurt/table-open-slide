import type { ContentLang } from './contentLang';
import type { AuthSession } from './types';

const SLIDE_W = 1280;
const SLIDE_H = 720;

export { SLIDE_H, SLIDE_W };

export function slidePreviewUrl(
  rel: string,
  session: AuthSession,
  lang: ContentLang,
  revision = 0,
  opts?: { layoutEdit?: boolean; layoutApply?: boolean; layoutProbe?: boolean },
): string {
  const q = new URLSearchParams({
    path: rel,
    email: session.email,
    token: session.token,
    lang,
  });
  if (revision > 0) q.set('v', String(revision));
  if (opts?.layoutEdit) q.set('layoutEdit', '1');
  if (opts?.layoutApply) q.set('layoutApply', '1');
  if (opts?.layoutProbe) q.set('layoutProbe', '1');
  return `/api/slide?${q.toString()}`;
}
