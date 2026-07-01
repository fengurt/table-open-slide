import { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDE_H, SLIDE_W } from './slideUrl';

function measureFit(container: HTMLElement): number {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w < 8 || h < 8) return 0;
  return Math.min(w / SLIDE_W, h / SLIDE_H);
}

export function SlideFrame({
  src,
  title,
  className = '',
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  const fit = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const next = measureFit(el);
    if (next > 0) setScale(next);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    fit();

    const ro = new ResizeObserver(() => fit());
    ro.observe(el);

    const parent = el.parentElement;
    if (parent) ro.observe(parent);

    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  useEffect(() => {
    setScale(0);
    const id = requestAnimationFrame(() => {
      fit();
      requestAnimationFrame(fit);
    });
    return () => cancelAnimationFrame(id);
  }, [fit]);

  const scaledW = SLIDE_W * scale;
  const scaledH = SLIDE_H * scale;
  const visible = scale > 0;

  return (
    <div ref={wrapRef} className={`slide-frame-wrap ${className}`.trim()}>
      <div
        className="slide-frame-scaler"
        style={{
          width: scaledW,
          height: scaledH,
          visibility: visible ? 'visible' : 'hidden',
        }}
      >
        <iframe
          title={title}
          src={src}
          width={SLIDE_W}
          height={SLIDE_H}
          className="slide-frame-iframe"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  );
}
