import { API_URL, EMULATOR_PROJECT, EMULATOR_URL, MAILPIT_URL, SEED_DOMAIN, SeedError, psql } from './config.ts';
import { assertEmulatorUp } from './preflight.ts';

const SEED_USERS = `select id from users where email like '%@${SEED_DOMAIN}'`;
const SEED_CONDOS = `select id from condominiums where requested_by in (${SEED_USERS})
  or id in (select condominium_id from condominium_managers where user_id in (${SEED_USERS}))
  or id in (select condominium_id from condominium_manager_invites where invited_by in (${SEED_USERS}) or invited_email like '%@${SEED_DOMAIN}')`;

export async function wipeExternal(): Promise<void> {
  const base = `${EMULATOR_URL}/identitytoolkit.googleapis.com/v1/projects/${EMULATOR_PROJECT}/accounts`;
  const headers = { authorization: 'Bearer owner', 'content-type': 'application/json' };
  const query = await fetch(`${base}:query`, { method: 'POST', headers, body: JSON.stringify({ returnUserInfo: true }) });
  if (!query.ok) throw new SeedError(`Emulator accounts:query failed (${query.status}): ${await query.text()}`);
  const { userInfo = [] } = (await query.json()) as { userInfo?: { localId: string; email?: string }[] };
  const localIds = userInfo.filter((user) => user.email?.toLowerCase().endsWith(`@${SEED_DOMAIN}`)).map((user) => user.localId);
  for (let start = 0; start < localIds.length; start += 1000) {
    const body = JSON.stringify({ localIds: localIds.slice(start, start + 1000), force: true });
    const deleted = await fetch(`${base}:batchDelete`, { method: 'POST', headers, body });
    if (!deleted.ok) throw new SeedError(`Emulator accounts:batchDelete failed (${deleted.status}): ${await deleted.text()}`);
  }
  await fetch(`${MAILPIT_URL}/search?query=${encodeURIComponent(`to:${SEED_DOMAIN}`)}`, { method: 'DELETE' }).catch(() => undefined);
}

export async function clean(): Promise<void> {
  await assertEmulatorUp();
  psql(`
    set local garagemja.audit_purge = 'on';
    create temp table seed_users on commit drop as ${SEED_USERS};
    create temp table seed_condos on commit drop as ${SEED_CONDOS};
    create temp table seed_residents on commit drop as select id from residents
      where user_id in (select id from seed_users) or condominium_id in (select id from seed_condos);
    create temp table seed_spots on commit drop as select id from parking_spots
      where condominium_id in (select id from seed_condos) or owner_resident_id in (select id from seed_residents);
    delete from rentals where condominium_id in (select id from seed_condos) or parking_spot_id in (select id from seed_spots)
      or renter_resident_id in (select id from seed_residents);
    delete from spot_availabilities where parking_spot_id in (select id from seed_spots);
    delete from vehicles where resident_id in (select id from seed_residents);
    delete from images where owner_id in (select id from seed_spots union select id from seed_condos);
    delete from parking_spots where id in (select id from seed_spots);
    delete from residents where id in (select id from seed_residents);
    delete from condominium_rules where condominium_id in (select id from seed_condos);
    delete from condominium_manager_invites where condominium_id in (select id from seed_condos)
      or invited_by in (select id from seed_users) or invited_email like '%@${SEED_DOMAIN}';
    delete from condominium_managers where condominium_id in (select id from seed_condos) or user_id in (select id from seed_users);
    delete from audit_logs where condominium_id in (select id from seed_condos) or user_id in (select id from seed_users);
    delete from condominiums where id in (select id from seed_condos);
    delete from user_roles where user_id in (select id from seed_users);
    delete from users where id in (select id from seed_users);
    delete from rate_limits;
  `, true);
  await wipeExternal();
  console.log(`Removed seed data (@${SEED_DOMAIN}) from database, emulator and Mailpit.`);
}

export async function rebuild(): Promise<void> {
  await assertEmulatorUp();
  psql('drop schema public cascade; create schema public;');
  await wipeExternal();
  console.log(`Schema public recreated. RESTART the API now (Flyway recreates the tables on startup); waiting for ${API_URL}/api/v1/status ...`);
  for (let attempt = 0; attempt < 120; attempt++) {
    const up = await fetch(`${API_URL}/api/v1/status`, { signal: AbortSignal.timeout(3000) })
      .then((r) => (r.ok ? r.json() : undefined), () => undefined);
    if (up?.status === 'UP' && psql("select to_regclass('public.flyway_schema_history') is not null") === 't' && psql('select count(*) from flyway_schema_history') !== '0') {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Timed out waiting for the API to come back UP after the schema reset.');
}
