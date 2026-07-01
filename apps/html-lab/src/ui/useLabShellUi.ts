import { useCallback, useEffect, useState } from 'react';
import { LAB_SIDEBAR_SECTIONS } from '../data/lab-nav';

const STORAGE_KEY = 'lab-shell-ui:v1';

export type LabShellUiState = {
  sidebarCollapsed: boolean;
  sectionsOpen: Record<string, boolean>;
};

const DEFAULT_SECTIONS_OPEN = Object.fromEntries(
  LAB_SIDEBAR_SECTIONS.map((s) => [s.id, s.id === 'studio' || s.id === 'decks' || s.id === 'runtimes']),
) as Record<string, boolean>;

function readState(): LabShellUiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sidebarCollapsed: false, sectionsOpen: { ...DEFAULT_SECTIONS_OPEN } };
    }
    const parsed = JSON.parse(raw) as Partial<LabShellUiState>;
    return {
      sidebarCollapsed: Boolean(parsed.sidebarCollapsed),
      sectionsOpen: { ...DEFAULT_SECTIONS_OPEN, ...parsed.sectionsOpen },
    };
  } catch {
    return { sidebarCollapsed: false, sectionsOpen: { ...DEFAULT_SECTIONS_OPEN } };
  }
}

function writeState(state: LabShellUiState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota */
  }
}

export function useLabShellUi() {
  const [state, setState] = useState<LabShellUiState>(readState);
  const [toast, setToast] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    writeState(state);
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setState((prev) => ({
      ...prev,
      sectionsOpen: {
        ...prev.sectionsOpen,
        [sectionId]: !prev.sectionsOpen[sectionId],
      },
    }));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  return {
    ...state,
    toast,
    shortcutsOpen,
    setShortcutsOpen,
    toggleSidebar,
    toggleSection,
    showToast,
  };
}

export type LabShellUi = ReturnType<typeof useLabShellUi>;
