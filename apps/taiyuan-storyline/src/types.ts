export type SlideTrack = 'presentation' | 'ai_report_2026_slides';

export type SlideManifestEntry = {
  rel: string;
  track: SlideTrack;
  trackLabel: string;
  order: number;
  title: string;
  briefing: string;
  tags: string[];
};

export type ManifestResponse = {
  root: string;
  slides: SlideManifestEntry[];
  scannedAt: number;
};
