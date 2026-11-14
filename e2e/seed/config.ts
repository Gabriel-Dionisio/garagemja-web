import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LOCAL_HOSTS, SeedError, pgEnv } from '../support/db.ts';

export { LOCAL_HOSTS, SeedError, psql, sqlString } from '../support/db.ts';

export const API_URL = process.env['API_URL'] ?? 'http://localhost:8080';
export const MAILPIT_URL = process.env['MAILPIT_URL'] ?? 'http://localhost:8025/api/v1';
export const EMULATOR_HOST = process.env['FIREBASE_AUTH_EMULATOR_HOST'] ?? 'localhost:9099';
export const EMULATOR_PROJECT = process.env['FIREBASE_PROJECT_ID'] ?? 'demo-garagemja';
export const EMULATOR_URL = `http://${EMULATOR_HOST}`;
export const SEED_DOMAIN = 'email.com.br';

const MIGRATIONS_DIR =
  process.env['MIGRATIONS_DIR'] ??
  fileURLToPath(
    new URL('../../../garagemja-api/src/main/resources/db/migration/', import.meta.url),
  );

export function migrationsDir(): string {
  if (!existsSync(MIGRATIONS_DIR)) {
    throw new SeedError(
      `Migrations directory not found: "${MIGRATIONS_DIR}". Set MIGRATIONS_DIR to garagemja-api/src/main/resources/db/migration.`,
    );
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
