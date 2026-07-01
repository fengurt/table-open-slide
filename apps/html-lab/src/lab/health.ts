export type LabHealthService = {
  id: string;
  label: string;
  port: number;
  online: boolean;
};

export type LabHealthResponse = {
  ok: boolean;
  scannedAt: number;
  services: LabHealthService[];
};

export async function fetchLabHealth(force = false): Promise<LabHealthResponse> {
  const url = force ? '/api/lab/health?force=1' : '/api/lab/health';
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as LabHealthResponse;
}

export function healthById(services: LabHealthService[]): Map<string, boolean> {
  return new Map(services.map((s) => [s.id, s.online]));
}
