import type { OpenSlideConfig } from '@open-slide/core';

const openSlideConfig: OpenSlideConfig = {
  content: {
    apiBaseUrl: 'http://localhost:3001/api',
    defaultLocale: 'en',
  },
  collaborationRole: 'author',
};

export default openSlideConfig;
