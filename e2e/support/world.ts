import { request, type APIRequestContext } from '@playwright/test';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { Api } from './api';
import { psql, sqlString } from './db';
import { PASSWORD, oobCodeFor, randomCnpj, randomCpf } from './real-api';
import { sessionFor } from './auth';

const MAX_ATTEMPTS = 3;
const AUTH_DIR = join(__dirname, '..', '.auth');

export interface Account {
  email: string;
  name: string;
}

export interface World {
  admin: Account;
  manager: Account;
  owner: Account;
  renter: Account;
  condominium: { id: string; name: string };
  ownerResidentId: string;
  renterResidentId: string;
  renterVehicleId: string;
  as(account: Account): Promise<Api>;
  dispose(): Promise<void>;
}

async function attempt<T>(what: string, run: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    try {
      return await run();
    } catch (error) {
      last = error;
    }
  }
  throw new Error(`${what} failed after ${MAX_ATTEMPTS} attempts: ${String(last)}`);
}

const token = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

async function anonymousApi(context: APIRequestContext): Promise<Api> {
  const api = new Api(context);
  await api.send('GET', '/api/v1/auth/csrf');
  return api;
}

export async function register(baseURL: string, name: string, role: string): Promise<Account> {
  return attempt(`register ${role}`, async () => {
    const email = `e2e.${role}.${token()}@email.com.br`;
    const context = await request.newContext({ baseURL, ignoreHTTPSErrors: true });
    try {
      const api = await anonymousApi(context);
      await api.send('POST', '/api/v1/auth/register', {
        name,
        email,
        password: PASSWORD,
        phone: '11987654321',
        cpf: randomCpf(),
      });
      const oobCode = await oobCodeFor(context, email, 10_000);
      await api.send('POST', '/api/v1/auth/verify-email', { oobCode });
      return { email, name };
    } finally {
      await context.dispose();
    }
  });
}

function promoteToAdmin(email: string): void {
  const id = `(select id from users where email = ${sqlString(email)})`;
  psql(
    `update users set cpf = null where id = ${id};
    delete from user_roles where user_id = ${id};
    insert into user_roles(user_id, role) values (${id}, 'ADMIN');`,
    true,
  );
}

export async function createWorld(baseURL: string): Promise<World> {
  const [admin, manager, owner, renter] = await Promise.all([
    register(baseURL, 'Teste Admin', 'admin'),
    register(baseURL, 'Teste Gestor', 'manager'),
    register(baseURL, 'Teste Dono', 'owner'),
    register(baseURL, 'Teste Locatario', 'renter'),
  ]);
  promoteToAdmin(admin.email);

  const contexts: APIRequestContext[] = [];
  const as = async (account: Account): Promise<Api> => {
    const context = await request.newContext({
      baseURL,
      ignoreHTTPSErrors: true,
      storageState: await sessionFor(account.email, baseURL),
    });
    contexts.push(context);
    return new Api(context);
  };
  const accounts = [admin, manager, owner, renter];
  const dispose = async () => {
    await Promise.all(contexts.map((context) => context.dispose()));
    for (const { email } of accounts) rmSync(join(AUTH_DIR, `${email}.json`), { force: true });
  };

  const managerApi = await as(manager);
  const name = `Residencial E2E ${token()}`;
  const created = await attempt('create condominium', () =>
    managerApi.send<{ id: string; cnpj: string }>('POST', '/api/v1/condominiums', {
      name,
      cnpj: randomCnpj(),
      address: 'Rua E2E',
      district: 'Centro',
      number: '100',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01310100',
      requesterResides: false,
    }),
  );
  await (await as(admin)).send('PATCH', `/api/v1/condominiums/${created.id}`, { status: 'ACTIVE' });
  await managerApi.send('PUT', `/api/v1/condominiums/${created.id}/rules`, {
    maxRentalDays: 15,
    cancellationDeadlineHours: 24,
    maxPricePerDay: 60,
    maxPricePerHour: 10,
    minRentalHours: 2,
    hourlyRentalsEnabled: true,
  });

  const residentIn = async (account: Account, unit: string): Promise<string> => {
    const { id } = await (
      await as(account)
    ).send<{ id: string }>('POST', '/api/v1/condominiums/join', { cnpj: created.cnpj, unit });
    await managerApi.send('PATCH', `/api/v1/residents/${id}`, { status: 'APPROVED' });
    return id;
  };
  const ownerResidentId = await residentIn(owner, '101');
  const renterResidentId = await residentIn(renter, '102');
  const vehicle = await attempt('create vehicle', async () =>
    (await as(renter)).send<{ id: string }>('POST', '/api/v1/vehicles', {
      residentId: renterResidentId,
      plate: randomPlate(),
      brand: 'Fiat',
      model: 'Argo',
      color: 'Prata',
    }),
  );

  return {
    admin,
    manager,
    owner,
    renter,
    condominium: { id: created.id, name },
    ownerResidentId,
    renterResidentId,
    renterVehicleId: vehicle.id,
    as,
    dispose,
  };
}

export function randomPlate(): string {
  const letter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digit = () => Math.floor(Math.random() * 10);
  return `${letter()}${letter()}${letter()}${digit()}${letter()}${digit()}${digit()}`;
}
