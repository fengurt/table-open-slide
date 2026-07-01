import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HtmlLabApp } from '../ui/HtmlLabApp';
import type { HtmlLabOptions } from './types';

export function mountHtmlLab(container: HTMLElement, options?: HtmlLabOptions): Root {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <HtmlLabApp options={options} />
    </StrictMode>,
  );
  return root;
}

export function unmountHtmlLab(root: Root): void {
  root.unmount();
}
