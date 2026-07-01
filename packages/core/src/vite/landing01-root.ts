import { existsSync } from 'node:fs';
import path from 'node:path';

/** Resolves a `landing01` directory next to common open-slide project layouts (monorepo `apps/<app>` or flat cwd). */
export function resolveLanding01Root(userCwd: string): string | null {
  const cwd = path.resolve(userCwd);
  const candidates = [
    path.join(cwd, 'landing01'),
    path.resolve(cwd, '../../landing01'),
    path.resolve(cwd, '../landing01'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return null;
}
