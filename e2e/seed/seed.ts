import { PASSWORD } from '../support/real-api.ts';
import { Session, userExists, verifyEmail } from './api-client.ts';
import { ACCOUNTS, CONDOS, RESIDENTS, STATUS_PATH, cpfFor, emailOf, type Account, type Condo, type Resident } from './data.ts';
import { SeedError, psql, sqlString } from './config.ts';
import { assertApiUp, assertApiUsesEmulator, assertEmulatorUp, assertSchemaCurrent } from './preflight.ts';

const sessions = new Map<string, Session>();
const log = (message: string) => console.log(`  ${message}`);

async function sessionFor(email: string): Promise<Session> {
  let session = sessions.get(email);
  if (!session) {
    session = await Session.open(email);
    await session.login();
    sessions.set(email, session);
  }
  return session;
}

async function waitForUser(email: string): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (userExists(email)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new SeedError(`Registration of ${email} returned 202 but no users row appeared (CPF clash or async failure; check the API log).`);
}

async function ensureAccount(account: Account): Promise<void> {
  if (userExists(account.email)) return log(`exists   ${account.email}`);
  const anonymous = await Session.open(account.email);
  await anonymous.call('register', 'POST', '/api/v1/auth/register', {
    name: account.name,
    email: account.email,
    password: PASSWORD,
    phone: '11987654321',
    cpf: cpfFor(account.cpfIndex),
  }, [202]);
  await waitForUser(account.email);
  await verifyEmail(account.email);
  log(`created  ${account.email}`);
}

function promoteAdmin(email: string): void {
  const id = `(select id from users where email = ${sqlString(email)})`;
  if (psql(`select 1 from user_roles where user_id = ${id} and role = 'ADMIN'`) === '1') return;
  psql(`update users set cpf = null, phone = null where id = ${id};
    delete from user_roles where user_id = ${id};
    insert into user_roles(user_id, role) values (${id}, 'ADMIN');`, true);
  log(`promoted ${email} to ADMIN`);
}

async function ensureCondo(condo: Condo): Promise<string> {
  let [id, status] = psql(`select id || '|' || status from condominiums where cnpj = ${sqlString(condo.cnpj)} and deleted_at is null`).split('|');
  if (!id) {
    const requester = await sessionFor(condo.requester);
    const created = await requester.call(`create condominium ${condo.key}`, 'POST', '/api/v1/condominiums', {
      name: condo.name,
      cnpj: condo.cnpj,
      address: 'Rua Seed',
      district: 'Centro',
      number: '100',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01310100',
      requesterResides: false,
    }, [201]);
    id = created.id;
    status = 'PENDING';
  }
  const path = STATUS_PATH[condo.target];
  const done = path.indexOf(status as never);
  const remaining = status === condo.target ? [] : path.slice(done + 1);
  if (remaining.length) {
    const admin = await sessionFor(emailOf('admin'));
    for (const next of remaining) {
      await admin.call(`set condominium ${condo.key} ${next}`, 'PATCH', `/api/v1/condominiums/${id}`, {
        status: next,
        ...(next === 'ACTIVE' ? {} : { statusReason: condo.reason }),
      }, [200]);
    }
  }
  log(`condo    ${condo.key}: ${remaining.length ? `-> ${condo.target}` : `already ${status}`}`);
  return id;
}

async function ensureResident(entry: Resident, condoIds: Map<string, string>): Promise<void> {
  const condo = CONDOS.find((c) => c.key === entry.condo)!;
  const condoId = condoIds.get(entry.condo)!;
  let [id, status] = psql(`select r.id || '|' || r.status from residents r join users u on u.id = r.user_id
    where u.email = ${sqlString(entry.account)} and r.condominium_id = '${condoId}' and r.deleted_at is null`).split('|');
  if (!id) {
    const resident = await sessionFor(entry.account);
    const body = { unit: entry.unit, ...(entry.block ? { block: entry.block } : {}) };
    if (entry.via === 'code') {
      const manager = await sessionFor(condo.requester);
      const { code } = await manager.call('read join code', 'GET', `/api/v1/condominiums/${condoId}/join-code`, undefined, [200]);
      id = (await resident.call('join by code', 'POST', `/api/v1/joins/${code}`, body, [201])).id;
    } else {
      id = (await resident.call('join by cnpj', 'POST', '/api/v1/condominiums/join', { cnpj: condo.cnpj, ...body }, [201])).id;
    }
    status = 'PENDING';
  }
  if (status !== entry.target) {
    const manager = await sessionFor(condo.requester);
    await manager.call(`set resident ${entry.account} ${entry.target}`, 'PATCH', `/api/v1/residents/${id}`, { status: entry.target }, [200]);
  }
  log(`resident ${entry.account}: ${entry.target}`);
}

async function ensureInvite(condoId: string): Promise<void> {
  const invitee = emailOf('invitee');
  const exists = psql(`select 1 from condominium_manager_invites where condominium_id = '${condoId}' and invited_email = ${sqlString(invitee)} limit 1`) === '1';
  if (!exists) {
    const manager = await sessionFor(emailOf('manager'));
    await manager.call('invite sindico', 'POST', `/api/v1/condominiums/${condoId}/manager-invites`, { email: invitee }, [202]);
  }
  log(`invite   ${invitee}: open`);
}

function printLogins(): void {
  const rows = ACCOUNTS.map((a) => `| ${a.email.padEnd(34)} | ${PASSWORD} | ${a.note}`);
  console.log(`\n| ${'e-mail'.padEnd(34)} | password  | state\n${rows.join('\n')}`);
}

export async function seed(): Promise<void> {
  await assertEmulatorUp();
  assertSchemaCurrent();
  await assertApiUp();
  await assertApiUsesEmulator();
  console.log('Accounts');
  for (const account of ACCOUNTS) await ensureAccount(account);
  promoteAdmin(emailOf('admin'));
  console.log('Condominiums');
  const condoIds = new Map<string, string>();
  for (const condo of CONDOS) condoIds.set(condo.key, await ensureCondo(condo));
  console.log('Residents and invites');
  for (const entry of RESIDENTS) await ensureResident(entry, condoIds);
  await ensureInvite(condoIds.get('active')!);
  printLogins();
}
