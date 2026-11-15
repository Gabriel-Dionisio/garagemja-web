import { expect, test } from './fixtures';
import { uniqueSpotNumber } from './support/api';

test.describe('owner with spots in several states', () => {
  const large = uniqueSpotNumber('A');
  const small = uniqueSpotNumber('B');
  const pending = uniqueSpotNumber('C');
  const rejected = uniqueSpotNumber('D');

  test.beforeAll(async ({ world }) => {
    const manager = await world.as(world.manager);
    const owner = await world.as(world.owner);
    const condominiumId = world.condominium.id;
    await manager.createSpot(condominiumId, large, 'LARGE', world.ownerResidentId);
    await manager.createSpot(condominiumId, small, 'SMALL', world.ownerResidentId);
    await owner.createSpot(condominiumId, pending);
    const { id } = await owner.createSpot(condominiumId, rejected);
    await manager.setSpotStatus(id, 'REJECTED', 'E2E: vaga inexistente');
  });

  test.beforeEach(async ({ world, loginAs, mySpots }) => {
    await loginAs(world.owner.email);
    await mySpots.goto();
    await expect(mySpots.spot(large)).toBeVisible();
  });

  test('filters by status', async ({ mySpots }) => {
    await mySpots.filterStatus('Pendentes');
    await expect(mySpots.spot(pending)).toContainText('Pendente');
    await expect(mySpots.spot(large)).toHaveCount(0);

    await mySpots.filterStatus('Rejeitadas');
    await expect(mySpots.spot(rejected)).toContainText('Motivo:');
    await expect(mySpots.spot(pending)).toHaveCount(0);
  });

  test('filters by size', async ({ mySpots }) => {
    await mySpots.filterSize('Pequena');
    await expect(mySpots.spot(small)).toBeVisible();
    await expect(mySpots.spot(large)).toHaveCount(0);

    await mySpots.filterSize('Qualquer tamanho');
    await expect(mySpots.spot(large)).toBeVisible();
  });

  test('searches by number', async ({ mySpots }) => {
    await mySpots.search(large);
    await expect(mySpots.spot(large)).toBeVisible();
    await expect(mySpots.items).toHaveCount(1);
  });

  test('searches by condominium', async ({ world, mySpots }) => {
    await mySpots.search(world.condominium.name);
    await expect(mySpots.spot(large)).toBeVisible();
  });

  test('searches by owner', async ({ world, mySpots }) => {
    await mySpots.search(world.owner.name);
    await expect(mySpots.spot(large)).toBeVisible();
  });

  test('search without match shows the empty state', async ({ mySpots }) => {
    await mySpots.search('ZZZ-NADA');
    await expect(mySpots.empty).toBeVisible();
  });
});

test('resident requests a new spot and sees it pending', async ({
  page,
  world,
  loginAs,
  mySpots,
  spotForm,
}) => {
  const number = uniqueSpotNumber('REQ');
  await loginAs(world.renter.email);
  await mySpots.goto();
  await mySpots.startNewSpot();
  await expect(spotForm.requestNote).toBeVisible();
  await spotForm.fill(number, 'Subsolo E2E', 'Grande');
  await spotForm.sendRequest.click();
  await expect(page).toHaveURL(/\/parking-spots$/);
  await mySpots.search(number);
  await expect(mySpots.spot(number)).toContainText('Pendente');
  await expect(mySpots.spot(number)).toContainText('Grande');
});
