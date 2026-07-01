const UI_KEY = 'html-lab:ui';

export type LabUiState = {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  tuneWidth: number;
  tuneOpen: boolean;
};

const DEFAULT_UI: LabUiState = {
  sidebarWidth: 280,
  sidebarCollapsed: false,
  tuneWidth: 340,
  tuneOpen: false,
};

export function loadUiState(): LabUiState {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return { ...DEFAULT_UI };
    return { ...DEFAULT_UI, ...(JSON.parse(raw) as Partial<LabUiState>) };
  } catch {
    return { ...DEFAULT_UI };
  }
}

export function saveUiState(state: LabUiState): void {
  localStorage.setItem(UI_KEY, JSON.stringify(state));
}

export function tuneKey(path: string): string {
  return `html-lab:tune:${path}`;
}

export function loadTuneParams(path: string): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(tuneKey(path));
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return null;
  }
}

export function saveTuneParams(path: string, params: Record<string, number>): void {
  localStorage.setItem(tuneKey(path), JSON.stringify(params));
}
