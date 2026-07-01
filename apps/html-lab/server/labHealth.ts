import net from 'node:net';
import type { Connect } from 'vite';

export type LabHealthService = {
  id: string;
  label: string;
  port: number;
  online: boolean;
};

/** Local dev services worth surfacing in the studio UI. */
const MONITORED: Array<{ id: string; label: string; port: number }> = [
  { id: 'html-lab', label: 'Content studio', port: 3333 },
  { id: 'open-slide-demo', label: 'open-slide demo', port: 5173 },
  { id: 'kind-viewer', label: 'kind-viewer', port: 5190 },
  { id: 'taiyuan-storyline', label: 'taiyuan-storyline', port: 5188 },
  { id: 'web-docs', label: 'Marketing & docs', port: 3000 },
  { id: 'cms-admin', label: 'Payload CMS', port: 3001 },
  { id: 'brief', label: 'Brief', port: 3010 },
  { id: 'financials', label: 'Financials', port: 3011 },
];

function probeHost(port: number, host: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

/** Vite may bind IPv6-only (::1); try both loopback addresses. */
function probePort(port: number, timeoutMs = 700): Promise<boolean> {
  return Promise.all([
    probeHost(port, '127.0.0.1', timeoutMs),
    probeHost(port, '::1', timeoutMs),
  ]).then((results) => results.some(Boolean));
}

export async function scanLabHealth(): Promise<LabHealthService[]> {
  const results = await Promise.all(
    MONITORED.map(async ({ id, label, port }) => ({
      id,
      label,
      port,
      online: await probePort(port),
    })),
  );
  return results;
}

export function attachLabHealthApi(middlewares: Connect.Server): void {
  let cache: { scannedAt: number; services: LabHealthService[] } | null = null;
  const CACHE_MS = 5_000;

  middlewares.use(async (req, res, next) => {
    if (req.method !== 'GET' || !req.url?.startsWith('/api/lab/health')) {
      next();
      return;
    }
    try {
      const u = new URL(req.url, 'http://localhost');
      const force = u.searchParams.get('force') === '1';
      const now = Date.now();
      if (force || !cache || now - cache.scannedAt > CACHE_MS) {
        const services = await scanLabHealth();
        cache = { scannedAt: now, services };
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'private, max-age=5');
      res.end(JSON.stringify({ ok: true, scannedAt: cache.scannedAt, services: cache.services }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: String(e instanceof Error ? e.message : e) }));
    }
  });
}
