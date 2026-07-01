import config from 'virtual:open-slide/config';
import { useCallback, useEffect, useState } from 'react';

export type SlideComment = {
  id: string;
  line: number;
  ts: string;
  note: string;
  hint?: string;
};

type ListResponse = { comments: SlideComment[] };

type CmsCommentDoc = {
  id: string | number;
  slideId?: string;
  line?: number;
  column?: number;
  note?: string;
  hint?: string;
  updatedAt?: string;
  createdAt?: string;
};

function mapCmsDoc(doc: CmsCommentDoc): SlideComment {
  return {
    id: String(doc.id),
    line: Number(doc.line ?? 0),
    ts: String(doc.updatedAt ?? doc.createdAt ?? ''),
    note: String(doc.note ?? ''),
    hint: doc.hint ? String(doc.hint) : undefined,
  };
}

export function useComments(slideId: string) {
  const [comments, setComments] = useState<SlideComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cmsBase = config.content?.apiBaseUrl;

  const refetch = useCallback(async () => {
    if (!slideId) return;
    try {
      if (cmsBase) {
        const query = new URLSearchParams();
        query.set('where[slideId][equals]', slideId);
        query.set('limit', '500');
        query.set('depth', '0');
        query.set('sort', '-createdAt');
        const res = await fetch(
          `${cmsBase.replace(/\/+$/, '')}/slide-comments?${query.toString()}`,
          {
            headers: { accept: 'application/json' },
          },
        );
        if (!res.ok) {
          setError(`GET slide-comments → ${res.status}`);
          return;
        }
        const data = (await res.json()) as { docs: CmsCommentDoc[] };
        setComments((data.docs ?? []).map(mapCmsDoc));
        setError(null);
        return;
      }

      const res = await fetch(`/__comments?slideId=${encodeURIComponent(slideId)}`);
      if (!res.ok) {
        setError(`GET /__comments → ${res.status}`);
        return;
      }
      const data = (await res.json()) as ListResponse;
      setComments(data.comments);
      setError(null);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  }, [slideId, cmsBase]);

  const add = useCallback(
    async (line: number, column: number, text: string) => {
      if (cmsBase) {
        const res = await fetch(`${cmsBase.replace(/\/+$/, '')}/slide-comments`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slideId,
            line,
            column,
            note: text,
            source: 'inspector',
            status: 'pending',
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
            errors?: unknown;
          };
          throw new Error(body.message ?? `POST slide-comments → ${res.status}`);
        }
        await refetch();
        return;
      }

      const res = await fetch('/__comments/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, line, column, text }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `POST /__comments/add → ${res.status}`);
      }
      await refetch();
    },
    [slideId, cmsBase, refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      if (cmsBase) {
        const res = await fetch(
          `${cmsBase.replace(/\/+$/, '')}/slide-comments/${encodeURIComponent(id)}`,
          {
            method: 'DELETE',
          },
        );
        if (!res.ok) throw new Error(`DELETE slide-comments/${id} → ${res.status}`);
        await refetch();
        return;
      }

      const res = await fetch(`/__comments/${id}?slideId=${encodeURIComponent(slideId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`DELETE /__comments/${id} → ${res.status}`);
      await refetch();
    },
    [slideId, cmsBase, refetch],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = () => refetch();
    import.meta.hot.on('vite:afterUpdate', handler);
    return () => {
      import.meta.hot?.off('vite:afterUpdate', handler);
    };
  }, [refetch]);

  return { comments, error, refetch, add, remove };
}
