import type { LayoutBox } from './layoutTypes';

export type DragMode =
  | 'move'
  | 'resize-n'
  | 'resize-s'
  | 'resize-e'
  | 'resize-w'
  | 'resize-nw'
  | 'resize-ne'
  | 'resize-sw'
  | 'resize-se';

const MIN = 8;

export function clampBox(box: LayoutBox): LayoutBox {
  const w = Math.max(MIN, Math.min(100, box.w));
  const h = Math.max(MIN, Math.min(100, box.h));
  return {
    x: Math.max(0, Math.min(100 - w, box.x)),
    y: Math.max(0, Math.min(100 - h, box.y)),
    w,
    h,
  };
}

export function snapValue(value: number, grid: number, enabled: boolean): number {
  if (!enabled || grid <= 0) return value;
  return Math.round(value / grid) * grid;
}

export function applyDrag(
  origin: LayoutBox,
  mode: DragMode,
  dx: number,
  dy: number,
  snap: boolean,
  grid: number,
): LayoutBox {
  let { x, y, w, h } = origin;

  switch (mode) {
    case 'move':
      x += dx;
      y += dy;
      break;
    case 'resize-e':
      w += dx;
      break;
    case 'resize-w':
      x += dx;
      w -= dx;
      break;
    case 'resize-s':
      h += dy;
      break;
    case 'resize-n':
      y += dy;
      h -= dy;
      break;
    case 'resize-se':
      w += dx;
      h += dy;
      break;
    case 'resize-sw':
      x += dx;
      w -= dx;
      h += dy;
      break;
    case 'resize-ne':
      y += dy;
      w += dx;
      h -= dy;
      break;
    case 'resize-nw':
      x += dx;
      y += dy;
      w -= dx;
      h -= dy;
      break;
    default:
      break;
  }

  return clampBox({
    x: snapValue(x, grid, snap),
    y: snapValue(y, grid, snap),
    w: snapValue(w, grid, snap),
    h: snapValue(h, grid, snap),
  });
}
