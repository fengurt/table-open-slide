declare module 'virtual:open-slide/slides' {
  import type { SlideModule } from './lib/sdk';
  export const slideIds: string[];
  export function loadSlide(id: string): Promise<SlideModule>;
}

declare module 'virtual:open-slide/config' {
  import type { CollaborationRole, Locale, SlideContentConfig } from '../config';

  const config: {
    slidesDir?: string;
    port?: number;
    locale?: Locale;
    build: {
      showSlideBrowser: boolean;
      showSlideUi: boolean;
      allowHtmlDownload: boolean;
    };
    content?: SlideContentConfig;
    collaborationRole?: CollaborationRole;
  };
  export default config;
}

declare module 'virtual:open-slide/folders' {
  import type { FoldersManifest } from './lib/sdk';

  const manifest: FoldersManifest;
  export default manifest;
}
