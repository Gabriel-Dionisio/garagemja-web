import { execFileSync } from 'node:child_process';

export const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export class SeedError extends Error {}

export function pgEnv(): NodeJS.ProcessEnv {
  if (process.env['PGHOSTADDR'])
    throw new SeedError('Refusing to run with PGHOSTADDR set; use PGHOST with a local host.');
  const host = process.env['PGHOST'] ?? '127.0.0.1';
  if (!LOCAL_HOSTS.has(host) && !host.startsWith('/'))
    throw new SeedError(`Refusing to touch non-local database host "${host}".`);
  return {
    PATH: process.env['PATH'],
    HOME: process.env['HOME'],
    LANG: process.env['LANG'],
    PGHOST: host,
    PGPORT: process.env['PGPORT'] ?? '5432',
    PGUSER: process.env['PGUSER'] ?? 'garagemja_user',
    PGDATABASE: process.env['PGDATABASE'] ?? 'garagemja_db',
    PGPASSWORD: process.env['PGPASSWORD'] ?? 'garagemja_password',
  };
}

export function psql(sql: string, singleTransaction = false): string {
  const env = pgEnv();
  const args = [
    '-X',
    '-A',
    '-t',
    '-v',
    'ON_ERROR_STOP=1',
    ...(singleTransaction ? ['-1'] : []),
    '-f',
    '-',
  ];
  try {
    return execFileSync('psql', args, {
      env,
      input: sql,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    throw new SeedError(
      `psql failed: ${String((error as { stderr?: string }).stderr ?? error).trim()}`,
    );
  }
}

export const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;
