import { expect, test } from './fixtures';
import { uniqueSpotNumber } from './support/api';
import type { World } from './support/world';

async function spotWithRental(world: World, number: string, start: number, finish?: string) {
  const manager = await world.as(world.manager);
  const { id: spotId } = await manager.createSpot(world.condominium.id, number);
  await manager.addAvailability(spotId, 9, 1, 90);
  const renter = await world.as(world.renter);
  const { id } = await renter.requestRental(
    spotId,
    world.renterResidentId,
    world.renterVehicleId,
    start,
    start + 2,
  );
  if (finish === 'APPROVED') await manager.setRentalStatus(id, 'APPROVED');
  if (finish === 'REFUSED') await manager.setRentalStatus(id, 'REFUSED', 'E2E: indisponivel');
  if (finish === 'CANCELED') await renter.setRentalStatus(id, 'CANCELED', 'E2E: mudei de planos');
}

test.describe('rentals in several states', () => {
  const numbers = {
    Recusado: uniqueSpotNumber('RF'),
    Cancelado: uniqueSpotNumber('RC'),
    Pendente: uniqueSpotNumber('RP'),
  };

  test.beforeAll(async ({ world }) => {
    await spotWithRental(world, numbers.Recusado, 50, 'REFUSED');
    await spotWithRental(world, numbers.Cancelado, 60, 'CANCELED');
    await spotWithRental(world, numbers.Pendente, 70);
  });

  for (const status of ['Recusado', 'Cancelado', 'Pendente'] as const) {
    test(`filters rentals by ${status}`, async ({ world, loginAs, myRentals }) => {
      await loginAs(world.renter.email);
      await myRentals.goto();
      await expect(myRentals.rental(numbers.Pendente)).toBeVisible();
      await myRentals.filterStatus(status);
      await expect(myRentals.rental(numbers[status])).toContainText(status);
      await expect(myRentals.items.filter({ hasNotText: status })).toHaveCount(0);
    });
  }
});

test('renter cancels a pending request', async ({ world, loginAs, myRentals }) => {
  const number = uniqueSpotNumber('RT');
  await spotWithRental(world, number, 80);

  await loginAs(world.renter.email);
  await myRentals.goto();
  await myRentals.filterStatus('Pendente');
  await expect(myRentals.rental(number)).toContainText('Pendente');
  await myRentals.cancel(number);
  await expect(myRentals.rental(number)).toHaveCount(0);
  await myRentals.filterStatus('Cancelado');
  await expect(myRentals.rental(number)).toContainText('Cancelado');
});

test('renter pays an approved rental with PIX and the confirmation arrives', async ({
  world,
  loginAs,
  myRentals,
}) => {
  const number = uniqueSpotNumber('RX');
  await spotWithRental(world, number, 90, 'APPROVED');

  await loginAs(world.renter.email);
  await myRentals.goto();
  await myRentals.payWithPix(number);
  await expect(myRentals.paymentDialog).toBeHidden({ timeout: 30_000 });
  await expect(myRentals.rental(number).getByRole('button', { name: 'Pagar' })).toHaveCount(0);
});
