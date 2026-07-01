export type { HtmlLabOptions } from './core';
export { mountHtmlLab, unmountHtmlLab, useHtmlLab } from './core';

import { AppRouter } from './router';

/** Root application — embeddable via mountHtmlLab or useHtmlLab. */
export function App() {
  return <AppRouter />;
}
