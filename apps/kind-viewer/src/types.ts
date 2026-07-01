export type LocaleMode = 'en' | 'zh' | 'both';

export type UserRole = 'admin' | 'viewer';

export type SlideManifestEntry = {
  rel: string;
  id: string;
  order: number;
  titleEn: string;
  titleZh: string;
  briefingEn: string;
  briefingZh: string;
  tags: string[];
};

export type ManifestResponse = {
  slides: SlideManifestEntry[];
  scannedAt: number;
};

export type CommentRecord = {
  id: string;
  slideRel: string;
  email: string;
  body: string;
  createdAt: number;
};

export type AuthSession = {
  email: string;
  token: string;
  role: UserRole;
};

export type PublicUser = {
  email: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
};
