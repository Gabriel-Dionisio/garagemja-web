import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';
import { API_URL, EMULATOR_HOST, EMULATOR_URL, LOCAL_HOSTS, SeedError, migrationsDir, psql } from './config.ts';

const REBUILD_HINT = 'Run `npm run seed:rebuild` to recreate the dev schema and re-seed.';

function flywayChecksum(path: string): number {
  const text = readFileSync(path, 'utf8').replace(/^﻿/, '');
  let value = 0;
  const lines = text.split(/\r\n|\r|\n/);
  if (lines.at(-1) === '') lines.pop();
  for (const line of lines) {
    value = crc32(Buffer.from(line, 'utf8'), value);
  }
  return value | 0;
}

export function assertEmulatorHost(): void {
  const host = new URL(EMULATOR_URL).hostname.replace(/^\[(.*)\]$/, '$1');
  if (!LOCAL_HOSTS.has(host)) {
    throw new SeedError(`FIREBASE_AUTH_EMULATOR_HOST must be local, got "${EMULATOR_HOST}".`);
  }
}

export async function assertEmulatorUp(): Promise<void> {
  assertEmulatorHost();
  const reachable = await fetch(EMULATOR_URL, { signal: AbortSignal.timeout(3000) }).then((r) => r.ok, () => false);
  if (!reachable) {
    throw new SeedError(`Firebase Auth emulator not responding at ${EMULATOR_URL}. Start it: podman compose up -d firebase-auth-emulator`);
  }
}

export function assertSchemaCurrent(): void {
  let applied: string;
  try {
    applied = psql('select version || \':\' || checksum from flyway_schema_history where success order by installed_rank');
  } catch (error) {
    if (/does not exist/.test((error as Error).message)) throw new SeedError(`Database schema is missing (flyway_schema_history/users not found). ${REBUILD_HINT}`);
    throw error;
  }
  const dir = migrationsDir();
  const expected = readdirSync(dir)
    .map((file) => /^V(\d+)__.*\.sql$/.exec(file))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => `${Number(match[1])}:${flywayChecksum(join(dir, match[0]))}`);
  const appliedSet = new Set(applied.split('\n'));
  const stale = expected.filter((entry) => !appliedSet.has(entry));
  if (stale.length > 0) {
    throw new SeedError(`Flyway checksum mismatch or pending migrations (${stale.map((s) => 'V' + s.split(':')[0]).join(', ')}): migrations were edited in place. ${REBUILD_HINT}`);
  }
}

export async function assertApiUp(): Promise<void> {
  const status = await fetch(`${API_URL}/api/v1/status`, { signal: AbortSignal.timeout(5000) }).then(
    (r) => (r.ok ? r.json() : undefined),
    () => undefined,
  );
  if (status?.status !== 'UP') {
    throw new SeedError(`API not UP at ${API_URL}. Start it with the dev profile and FIREBASE_AUTH_EMULATOR_HOST (see garagemja-api operations doc). If Flyway fails on checksum, run \`npm run seed:rebuild\`.`);
  }
}

export async function assertApiUsesEmulator(): Promise<void> {
  const email = `seed.canary.1@email.com.br`;
  const base = `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts`;
  const json = { 'content-type': 'application/json' };
  const created = await fetch(`${base}:signUp?key=fake`, { method: 'POST', headers: json, body: JSON.stringify({ email, password: '@Teste123' }) });
  const { idToken } = (await created.json()) as { idToken?: string };
  try {
    const csrf = await fetch(`${API_URL}/api/v1/auth/csrf`);
    const cookie = csrf.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    const token = /XSRF-TOKEN=([^;]+)/.exec(cookie)?.[1] ?? '';
    const login = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { ...json, cookie, 'x-xsrf-token': decodeURIComponent(token) },
      body: JSON.stringify({ email, password: '@Teste123' }),
    });
    if (login.status !== 403) {
      throw new SeedError(`API does not appear to use the Firebase emulator (canary login returned ${login.status}, expected 403). Start the API with FIREBASE_AUTH_EMULATOR_HOST=${EMULATOR_HOST}. Refusing to seed real Firebase.`);
    }
  } finally {
    if (idToken) await fetch(`${base}:delete?key=fake`, { method: 'POST', headers: json, body: JSON.stringify({ idToken }) });
  }
}
