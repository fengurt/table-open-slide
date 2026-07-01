export type HtmlItem = { path: string; mtimeMs: number; size: number };

export type ListResponse = { items: HtmlItem[]; truncated: boolean; total: number };

export type PreviewTab = 'original' | 'fromMd';

export type SelectedComponent = {
  id: string;
  label: string;
  elementIndex: number;
};

export type HtmlLabOptions = {
  /** Roots scanned for HTML files (default: landing01, slides) */
  watchRoots?: readonly string[];
  /** Initial file path (?path= deep link overrides) */
  initialPath?: string | null;
  /** Called when user selects a file */
  onSelect?: (path: string) => void;
};

export type SearchResult = HtmlItem & { score: number; segments: string[] };
