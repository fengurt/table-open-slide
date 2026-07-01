export type LayoutMeasure = {
  overflow: boolean;
  regions: { selector: string; scrollHeight: number; clientHeight: number }[];
};

export type MeasureResultMessage = {
  type: 'hl-lab-measure-result';
  id: string;
  overflow: boolean;
  regions: LayoutMeasure['regions'];
};

let measureSeq = 0;

export function measurePreviewLayout(iframe: HTMLIFrameElement): Promise<LayoutMeasure> {
  const win = iframe.contentWindow;
  if (!win) {
    return Promise.resolve({ overflow: false, regions: [] });
  }

  const id = `m-${++measureSeq}-${Date.now()}`;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', onMessage);
      resolve({ overflow: false, regions: [] });
    }, 1200);

    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as MeasureResultMessage | undefined;
      if (!data || data.type !== 'hl-lab-measure-result' || data.id !== id) return;
      window.clearTimeout(timeout);
      window.removeEventListener('message', onMessage);
      resolve({ overflow: data.overflow, regions: data.regions });
    };

    window.addEventListener('message', onMessage);
    win.postMessage({ type: 'hl-lab-measure', id }, '*');
  });
}
