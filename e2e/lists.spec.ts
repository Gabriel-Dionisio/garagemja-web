import { expect, test } from './fixtures';
import { uniqueSpotNumber } from './support/api';

const active = uniqueSpotNumber('LA');
const pending = uniqueSpotNumber('LP');
let activeId: string;

test.beforeAll(async ({ world }) => {
  const manager = await world.as(world.manager);
  activeId = (
    await manager.createSpot(world.condominium.id, active, 'MEDIUM', world.ownerResidentId)
  ).id;
  await (await world.as(world.owner)).createSpot(world.condominium.id, pending);
});

test('my spots: "Ver detalhes" is an eye icon that opens the spot details', async ({
  world,
  loginAs,
  mySpots,
  page,
}) => {
  await loginAs(world.owner.email);
  await mySpots.goto();
  await mySpots.search(active);
  await expect(mySpots.spot(active)).toBeVisible();
  await mySpots
    .spot(active)
    .getByRole('link', { name: `Ver detalhes: ${active}` })
    .click();
  await expect(page).toHaveURL(new RegExp(`/search/${activeId}`));
});

test('my spots: a pending spot has no "Ver detalhes" icon', async ({ world, loginAs, mySpots }) => {
  await loginAs(world.owner.email);
  await mySpots.goto();
  await mySpots.search(pending);
  await expect(mySpots.spot(pending)).toContainText('Pendente');
  await expect(mySpots.spot(pending).getByRole('link', { name: /Ver detalhes/ })).toHaveCount(0);
});

test('condominium spot list: the item is a link to the spot', async ({
  world,
  loginAs,
  condominiumSpots,
  page,
}) => {
  await loginAs(world.manager.email);
  await condominiumSpots.goto(world.condominium.name);
  await condominiumSpots.search(active);
  await condominiumSpots.spot(active).locator('a.main').click();
  await expect(page).toHaveURL(
    new RegExp(`/condominiums/${world.condominium.id}/parking-spots/${activeId}`),
  );
});

test('admin users: the item is a link to the user, an unknown e-mail finds nobody', async ({
  world,
  loginAs,
  shell,
  page,
}) => {
  await loginAs(world.admin.email);
  await shell.open('Usuários');
  await page.getByRole('button', { name: /^Filtros/ }).click();
  const email = page.getByLabel('E-mail');
  const apply = page.getByRole('button', { name: 'Filtrar', exact: true });
  await email.fill('ninguem.e2e@email.com.br');
  await apply.click();
  await expect(page.getByRole('heading', { name: /Nenhum/ })).toBeVisible();

  await email.fill(world.renter.email);
  await apply.click();
  const item = page.getByRole('list', { name: 'Lista de usuários' }).getByRole('listitem');
  await expect(item).toHaveCount(1);
  await item.locator('a.main').click();
  await expect(page).toHaveURL(/\/admin\/users\/[0-9a-f-]+$/);
});

test('residents and managers: the item is a link to the public profile', async ({
  world,
  loginAs,
  condominiums,
  condominiumDetail,
  page,
}) => {
  await loginAs(world.manager.email);
  await condominiums.open(world.condominium.name);
  await condominiumDetail.openTab('Moradores');
  await page.getByRole('listitem').filter({ hasText: world.renter.name }).locator('a.main').click();
  await expect(page).toHaveURL(/\/users\/[0-9a-f-]+\/profile$/);

  await page.goBack();
  await condominiumDetail.openTab('Síndicos');
  await page
    .getByRole('listitem')
    .filter({ hasText: world.manager.name })
    .locator('a.main')
    .click();
  await expect(page).toHaveURL(/\/users\/[0-9a-f-]+\/profile$/);
});
