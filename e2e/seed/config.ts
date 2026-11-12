import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const API_URL = process.env['API_URL'] ?? 'http://localhost:8080';
export const MAILPIT_URL = process.env['MAILPIT_URL'] ?? 'http://localhost:8025/api/v1';
export const EMULATOR_HOST = process.env['FIREBASE_AUTH_EMULATOR_HOST'] ?? 'localhost:9099';
export const EMULATOR_PROJECT = process.env['FIREBASE_PROJECT_ID'] ?? 'demo-garagemja';
export const EMULATOR_URL = `http://${EMULATOR_HOST}`;
export const SEED_DOMAIN = 'email.com.br';

const MIGRATIONS_DIR =
  process.env['MIGRATIONS_DIR'] ??
  fileURLToPath(new URL('../../../garagemja-api/src/main/resources/db/migration/', import.meta.url));

export const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export class SeedError extends Error {}

export function migrationsDir(): string {
  if (!existsSync(MIGRATIONS_DIR)) {
    throw new SeedError(`Migrations directory not found: "${MIGRATIONS_DIR}". Set MIGRATIONS_DIR to garagemja-api/src/main/resources/db/migration.`);
  }
  return MIGRATIONS_DIR;
}

export function assertLocalUrl(name: string, value: string): void {
  let host: string;
  try {
    host = new URL(value).hostname.replace(/^\[(.*)\]$/, '$1');
  } catch {
    throw new SeedError(`${name} is not a valid URL: "${value}".`);
  }
  if (!LOCAL_HOSTS.has(host)) throw new SeedError(`Refusing non-local ${name} "${value}".`);
}

export function assertLocalTargets(): void {
  assertLocalUrl('API_URL', API_URL);
  assertLocalUrl('MAILPIT_URL', MAILPIT_URL);
  assertLocalUrl('FIREBASE_AUTH_EMULATOR_HOST', EMULATOR_URL);
  pgEnv();
}

function pgEnv(): NodeJS.ProcessEnv {
  if (process.env['PGHOSTADDR']) throw new SeedError('Refusing to run with PGHOSTADDR set; use PGHOST with a local host.');
  const host = process.env['PGHOST'] ?? '127.0.0.1';
  if (!LOCAL_HOSTS.has(host) && !host.startsWith('/')) throw new SeedError(`Refusing to touch non-local database host "${host}".`);
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
  const args = ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', ...(singleTransaction ? ['-1'] : []), '-f', '-'];
  try {
    return execFileSync('psql', args, { env, input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    throw new SeedError(`psql failed: ${String((error as { stderr?: string }).stderr ?? error).trim()}`);
  }
}

export const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;
