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
  const { requests } = user;
  await user.actAs(world.owner);
  await requests.goto();
  await expect(requests.request(canceled)).toHaveCount(0);
  await expect(requests.request(refused)).toContainText('Pendente');

  await requests.refuse(refused, 'E2E: vaga em manutencao');
  await expect(requests.request(refused)).toHaveCount(0);

  await requests.approve(approved);
  await expect(requests.request(approved)).toHaveCount(0);

  await requests.filterStatus('Recusada');
  await expect(requests.request(refused)).toContainText('E2E: vaga em manutencao');
});

test('renter sees the decisions', async ({ world }) => {
  await user.actAs(world.renter);
  await user.myRentals.goto();
  await expect(user.myRentals.rental(refused)).toContainText('Recusado');
  await expect(user.myRentals.rental(refused)).toContainText('E2E: vaga em manutencao');
  await expect(user.myRentals.rental(approved)).toContainText('Aprovado');
  await expect(
    user.myRentals.rental(refused).getByRole('button', { name: /Cancelar pedido/ }),
  ).toHaveCount(0);
});
