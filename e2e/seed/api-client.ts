import { request, type APIRequestContext } from '@playwright/test';
import { API_URL, SeedError, psql, sqlString } from './config.ts';
import { PASSWORD, oobCodeFor } from '../support/real-api.ts';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export class Session {
  private cookies = new Map<string, string>();

  private readonly context: APIRequestContext;
  readonly email: string;

  private constructor(context: APIRequestContext, email: string) {
    this.context = context;
    this.email = email;
  }

  static async open(email: string): Promise<Session> {
    const session = new Session(await request.newContext({ baseURL: API_URL }), email);
    await session.call('csrf', 'GET', '/api/v1/auth/csrf', undefined, [204]);
    return session;
  }

  private async raw(method: Method, path: string, body?: unknown) {
    const response = await this.context.fetch(path, {
      method,
      data: body,
      failOnStatusCode: false,
      headers: {
        cookie: [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; '),
        'x-xsrf-token': decodeURIComponent(this.cookies.get('XSRF-TOKEN') ?? ''),
      },
    });
    for (const header of response.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie')) {
      const [name, ...rest] = header.value.split(';')[0].split('=');
      this.cookies.set(name.trim(), rest.join('='));
    }
    return { status: response.status(), text: await response.text() };
  }

  async call(step: string, method: Method, path: string, body: unknown, expected: number[]): Promise<any> {
    const { status, text } = await this.raw(method, path, body);
    if (!expected.includes(status)) {
      throw new SeedError(
        `API contract changed or step failed: ${step}\n  ${method} ${path} -> ${status} (expected ${expected.join('|')})\n  body: ${text.slice(0, 400)}\n  request: ${JSON.stringify(redact(body))}`,
      );
    }
    return text ? JSON.parse(text) : undefined;
  }

  async login(): Promise<void> {
    const credentials = { email: this.email, password: PASSWORD };
    let result = await this.raw('POST', '/api/v1/auth/login', credentials);
    if (result.status === 403 && result.text.includes('not-verified')) {
      await verifyEmail(this.email);
      result = await this.raw('POST', '/api/v1/auth/login', credentials);
    }
    if (result.status !== 200) {
      throw new SeedError(`API contract changed or step failed: login ${this.email}\n  POST /api/v1/auth/login -> ${result.status}\n  body: ${result.text.slice(0, 300)}`);
    }
    await this.call('csrf', 'GET', '/api/v1/auth/csrf', undefined, [204]);
  }
}

const redact = (body: unknown) =>
  body && typeof body === 'object' ? { ...body, password: undefined, cpf: undefined } : body;

export async function verifyEmail(email: string): Promise<void> {
  const mail = await request.newContext();
  const anonymous = await Session.open(email);
  try {
    const oobCode = await oobCodeFor(mail, email);
    await anonymous.call('verify e-mail', 'POST', '/api/v1/auth/verify-email', { oobCode }, [204]);
  } finally {
    await mail.dispose();
  }
}

export const userExists = (email: string): boolean => psql(`select 1 from users where email = ${sqlString(email)}`) === '1';
