export type LayoutBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LayoutBlocks = Record<string, LayoutBox>;

export type LayoutPayload = {
  blocks: LayoutBlocks;
  labels: Record<string, string>;
};

export type MeasuredBlock = LayoutBox & {
  id: string;
  label: string;
};
