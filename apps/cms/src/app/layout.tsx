import type { ReactNode } from 'react';

/**
 * Next requires a root `app/layout.tsx`. Payload's `RootLayout` already emits
 * `<html>` / `<body>` for `/admin` — do not wrap the tree in another document
 * or you get nested `<html>` and hydration errors.
 *
 * Route groups `(site)` and `(payload)` each supply their own document shell.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
