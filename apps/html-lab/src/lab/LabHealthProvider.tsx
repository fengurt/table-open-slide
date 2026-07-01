import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchLabHealth, healthById, type LabHealthService } from './health';

const POLL_MS = 30_000;

type LabHealthValue = {
  services: LabHealthService[];
  online: Map<string, boolean>;
  loading: boolean;
  scannedAt: number | null;
  refresh: (force?: boolean) => Promise<void>;
};

const LabHealthContext = createContext<LabHealthValue | null>(null);

export function LabHealthProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<LabHealthService[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannedAt, setScannedAt] = useState<number | null>(null);

  const refresh = useCallback(async (force = false) => {
    try {
      const data = await fetchLabHealth(force);
      setServices(data.services);
      setScannedAt(data.scannedAt);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const tick = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    const id = window.setInterval(tick, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      services,
      online: healthById(services),
      loading,
      scannedAt,
      refresh,
    }),
    [services, loading, scannedAt, refresh],
  );

  return <LabHealthContext.Provider value={value}>{children}</LabHealthContext.Provider>;
}

export function useLabHealth(): LabHealthValue {
  const ctx = useContext(LabHealthContext);
  if (!ctx) {
    throw new Error('useLabHealth must be used within LabHealthProvider');
  }
  return ctx;
}
