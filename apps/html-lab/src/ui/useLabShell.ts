import { useContext } from 'react';
import { LabShellContext } from './LabShellContext';
import type { LabShellUi } from './useLabShellUi';

export function useLabShell(): LabShellUi {
  const ctx = useContext(LabShellContext);
  if (!ctx) throw new Error('useLabShell must be used within LabShellProvider');
  return ctx;
}
