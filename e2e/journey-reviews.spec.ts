import { expect, test } from './fixtures';
import { uniqueSpotNumber } from './support/api';
import { psql } from './support/db';

test('renter reviews a finished rental and the review stays hidden until both sides review', async ({
  world,
  loginAs,
  myRentals,
  page,
  guard,
}) => {
  guard.allowApi(409, /\/rentals\/[^/]+\/reviews$/);
  guard.allowErrorAlerts();
  const number = uniqueSpotNumber('AV');
  const manager = await world.as(world.manager);
  const { id: spotId } = await manager.createSpot(world.condominium.id, number);
  await manager.addAvailability(spotId, 9, 1, 120);
  const renter = await world.as(world.renter);
  const { id: rentalId } = await renter.requestRental(
    spotId,
    world.renterResidentId,
    world.renterVehicleId,
    110,
    112,
  );
  await manager.setRentalStatus(rentalId, 'APPROVED');
  psql(`update rentals set status = 'FINISHED', start_date = current_date - 5,
    end_date = current_date - 3 where id = '${rentalId}'`);

  await loginAs(world.renter.email);
  await myRentals.goto();
  await myRentals.rental(number).getByRole('button', { name: 'Avaliar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Avaliar a vaga' });
  await dialog.getByRole('button', { name: '5 ★' }).click();
  await dialog.getByLabel('Comentário (opcional)').fill('E2E: vaga excelente');
  await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();
  await expect(dialog).toBeHidden();

  await myRentals.rental(number).getByRole('button', { name: 'Avaliar' }).click();
  await dialog.getByRole('button', { name: '4 ★' }).click();
  await dialog.getByRole('button', { name: 'Enviar avaliação' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Você já avaliou este aluguel.');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();

  await page.goto(`/search/${spotId}`);
  await expect(page.getByRole('heading', { name: 'Avaliações', exact: true })).toBeVisible();
  await expect(page.getByText('Sem avaliações ainda')).toBeVisible();
  await expect(page.getByText('E2E: vaga excelente')).toHaveCount(0);
});

test('admin sees the review report queue with status filters', async ({ world, loginAs, page }) => {
  await loginAs(world.admin.email);
  await page.goto('/admin/reviews');
  await expect(page.getByRole('heading', { name: 'Denúncias de avaliações' })).toBeVisible();
  const filter = page.getByRole('group', { name: 'Status da denúncia' });
  await filter.getByRole('button', { name: 'Todas', exact: true }).click();
  await expect(filter.getByRole('button', { name: 'Todas', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('a stranger cannot open a public profile', async ({ world, loginAs, page, guard }) => {
  guard.allowApi(404, /\/users\/[^/]+\/profile$/);
  guard.allowErrorAlerts();
  await loginAs(world.renter.email);
  await page.goto(`/users/${crypto.randomUUID()}/profile`);
  await expect(page.getByText('Usuário não encontrado.')).toBeVisible();
});
