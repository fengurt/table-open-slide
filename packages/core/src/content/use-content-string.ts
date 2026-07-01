import { useSlideContentContext } from './content-context.tsx';

export function useContentString(contentKey: string, fallback: string): string {
  const ctx = useSlideContentContext();
  if (!ctx) return fallback;
  return ctx.getString(contentKey, fallback);
}
