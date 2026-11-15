import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const LOCAL = new Set(['localhost', '127.0.0.1', '::1']);
const apiHost = new URL(process.env.API_URL ?? 'http://localhost:8080').hostname;
if (!LOCAL.has(apiHost)) {
  console.error(`Refusing to start a rate-limit-free API for non-local host "${apiHost}".`);
  process.exit(1);
}

const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  JAVA_HOME: process.env.JAVA_HOME,
  SPRING_PROFILES_ACTIVE: 'dev',
  RATE_LIMIT_ENABLED: 'false',
  FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST ?? 'localhost:9099',
  FIREBASE_PROJECT_ID: 'demo-garagemja',
  FIREBASE_WEB_API_KEY: 'fake-api-key',
  RATE_LIMIT_SECRET: randomBytes(32).toString('hex'),
  REMEMBER_ME_SECRET: randomBytes(32).toString('hex'),
  SECURITY_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
};

const cwd = fileURLToPath(new URL('../../../garagemja-api/', import.meta.url));
const api = spawn('./gradlew', ['bootRun'], { cwd, env, stdio: 'inherit', detached: false });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => api.kill(signal));
api.on('exit', (code) => process.exit(code ?? 0));
