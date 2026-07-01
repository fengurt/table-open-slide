import { createContext } from 'react';
import type { LabShellUi } from './useLabShellUi';

const LabShellContext = createContext<LabShellUi | null>(null);

export function LabShellProvider({
  value,
  children,
}: {
  value: LabShellUi;
  children: React.ReactNode;
}) {
  return <LabShellContext.Provider value={value}>{children}</LabShellContext.Provider>;
}

export { LabShellContext };
