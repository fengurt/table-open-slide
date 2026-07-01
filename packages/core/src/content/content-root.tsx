import config from 'virtual:open-slide/config';
import type { ReactNode } from 'react';
import { ContentProvider } from './content-context.tsx';

export function ContentRoot({ children }: { children: ReactNode }) {
  const slideContent = config.content;
  if (!slideContent?.apiBaseUrl) {
    return children;
  }
  return (
    <ContentProvider
      apiBaseUrl={slideContent.apiBaseUrl}
      defaultLocale={slideContent.defaultLocale}
    >
      {children}
    </ContentProvider>
  );
}
