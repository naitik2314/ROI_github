import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WorkspaceStorage } from './types.ts';

export const TEMPORARY_STORAGE_NOTICE = 'Saved versions, research history and monitoring records are temporary on this deployment. They may disappear after a restart or be unavailable on another server instance. Permanent shared saves require an external database.';

export function storageConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
  cwd = process.cwd(),
  temporaryRoot = tmpdir(),
): { path: string; status: WorkspaceStorage } {
  // /var/task is the read-only application root in Vercel's function runtime.
  const temporary = env.VERCEL === '1' || Boolean(env.VERCEL_ENV) || cwd === '/var/task';
  return {
    path: env.FIELDWORK_DB_PATH || join(temporary ? temporaryRoot : cwd, '.fieldwork', 'interventions.sqlite'),
    status: temporary
      ? { mode: 'temporary', label: 'Temporary storage', notice: TEMPORARY_STORAGE_NOTICE }
      : { mode: 'local', label: 'Local SQLite storage', notice: null },
  };
}
