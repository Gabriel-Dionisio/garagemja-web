import { test } from './fixtures';
import { expect } from '@playwright/test';
import { uniqueSpotNumber } from './support/api';
import { Journey } from './support/journey';

test.describe.configure({ mode: 'serial' });

const refused = uniqueSpotNumber('JA');
const approved = uniqueSpotNumber('JB');
const canceled = uniqueSpotNumber('JC');
let user: Journey;

test.beforeAll(async ({ window, baseURL, world }) => {
  user = await Journey.start(window, String(baseURL));
  const manager = await world.as(world.manager);
  const owner = await world.as(world.owner);
  const renter = await world.as(world.renter);
  for (const number of [refused, approved, canceled]) {
    const { id } = await manager.createSpot(
      world.condominium.id,
      number,
      'MEDIUM',
      world.ownerResidentId,
    );
    await owner.addAvailability(id, 9, 1, 90);
    await renter.requestRental(id, world.renterResidentId, world.renterVehicleId, 10, 12);
  }
});
test.afterEach(() => user.expectNoProblems());

test('renter sees the three pending requests and cancels one', async ({ world }) => {
  await user.actAs(world.renter);
  await user.myRentals.goto();
  for (const number of [refused, approved, canceled]) {
    await expect(user.myRentals.rental(number)).toContainText('Pendente');
  }
  await user.myRentals.cancel(canceled);
  await user.myRentals.filterStatus('Cancelado');
  await expect(user.myRentals.rental(canceled)).toContainText('Cancelado');
});

test('owner refuses one request with a reason and approves another', async ({ world }) => {
  const { page } = user;
  await user.actAs(world.owner);
  await user.shell.open('Painel');
  await expect(page.getByRole('button', { name: `Aprovar: ${canceled}` })).toHaveCount(0);

  await page.getByRole('button', { name: `Recusar: ${refused}` }).click();
  await expect(user.confirm.root).toBeVisible();
  await user.confirm.root.getByRole('button', { name: 'Recusar', exact: true }).click();
  await expect(user.confirm.reason).toBeVisible();
  await user.confirm.confirm('Recusar', 'E2E: vaga em manutencao');
  await expect(page.getByRole('button', { name: `Recusar: ${refused}` })).toHaveCount(0);

  await page.getByRole('button', { name: `Aprovar: ${approved}` }).click();
  await user.confirm.confirm('Aprovar');
  await expect(page.getByRole('button', { name: `Aprovar: ${approved}` })).toHaveCount(0);
});

test('renter sees the decisions', async ({ world }) => {
  await user.actAs(world.renter);
  await user.myRentals.goto();
  await expect(user.myRentals.rental(refused)).toContainText('Recusado');
  await expect(user.myRentals.rental(approved)).toContainText('Aprovado');
  await expect(
    user.myRentals.rental(refused).getByRole('button', { name: /Cancelar pedido/ }),
  ).toHaveCount(0);
});
