import type { Locale } from './locale/types';

export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
};

export type ContentLocaleId = 'en' | 'zh-CN' | 'zh-TW' | 'ja';

export type SlideContentConfig = {
  /** Base URL for Payload REST, e.g. http://localhost:3001/api */
  apiBaseUrl: string;
  defaultLocale: ContentLocaleId;
};

export type CollaborationRole =
  | 'superadmin'
  | 'author'
  | 'editor'
  | 'reviewer'
  | 'translator'
  | 'approver'
  | 'viewer'
  | 'presenter'
  | 'data-owner';

export type OpenSlideConfig = {
  slidesDir?: string;
  port?: number;
  locale?: Locale;
  build?: OpenSlideBuildConfig;
  /** When set, slide surfaces can resolve copy from the CMS via REST. */
  content?: SlideContentConfig;
  /** Dev/preview role for inspector gating (override with VITE_OPENSLIDE_ROLE in user config if supported). */
  collaborationRole?: CollaborationRole;
};
