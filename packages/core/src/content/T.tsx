import type { CSSProperties, ReactNode } from 'react';
import { useSlideContentContext } from './content-context.tsx';

export type SlideTextProps = {
  /** CMS content-blocks key */
  contentKey: string;
  /** Shown while loading or when CMS has no value */
  fallback: string;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
};

/**
 * CMS-bound text span. Forwards `data-slide-loc` when injected by the loc-tags plugin (component name `T`).
 */
export function T({ contentKey, fallback, children, style, className, ...rest }: SlideTextProps) {
  const ctx = useSlideContentContext();
  const text = ctx ? ctx.getString(contentKey, fallback) : fallback;
  return (
    <span style={style} className={className} {...rest}>
      {children ?? text}
    </span>
  );
}
