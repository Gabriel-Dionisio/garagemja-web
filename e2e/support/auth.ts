import { request } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Api } from './api';

type StorageState = Awaited<ReturnType<Api['storageState']>>;

const AUTH_DIR = join(__dirname, '..', '.auth');
const sessions = new Map<string, Promise<StorageState>>();

export function sessionFor(email: string, baseURL: string | undefined): Promise<StorageState> {
  let session = sessions.get(email);
  if (!session) {
    session = loadOrLogin(email, baseURL);
    sessions.set(email, session);
  }
  return session;
}

async function loadOrLogin(email: string, baseURL: string | undefined): Promise<StorageState> {
  const file = join(AUTH_DIR, `${email}.json`);
  if (existsSync(file)) {
    const saved = await request.newContext({
      baseURL,
      ignoreHTTPSErrors: true,
      storageState: file,
    });
    const valid = ![401, 403].includes((await saved.get('/api/v1/auth/me')).status());
    await saved.dispose();
    if (valid) return JSON.parse(readFileSync(file, 'utf8'));
  }
  mkdirSync(AUTH_DIR, { recursive: true });
  const context = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
  const api = await new Api(context).login(email);
  const state = await api.storageState(file);
  await context.dispose();
  return state;
}
