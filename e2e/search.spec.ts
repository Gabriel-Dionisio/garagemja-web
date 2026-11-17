import { expect, test } from './fixtures';
import { uniqueSpotNumber } from './support/api';
import { SpotSearchPage } from './pages/spot-search.page';

const covered = uniqueSpotNumber('SC');
const open = uniqueSpotNumber('SU');
let coveredId: string;

test.beforeAll(async ({ world }) => {
  const manager = await world.as(world.manager);
  const first = await manager.createSpot(
    world.condominium.id,
    covered,
    'SMALL',
    world.ownerResidentId,
    true,
  );
  coveredId = first.id;
  const second = await manager.createSpot(world.condominium.id, open, 'LARGE');
  await (await world.as(world.owner)).addAvailability(first.id, 9, 0, 40);
  await manager.addAvailability(second.id, 9, 0, 40);
  for (const shade of [40, 200]) {
    await manager.uploadImage(`/api/v1/parking-spots/${coveredId}/images`, shade);
  }
});

test('search card shows size and coverage chips and opens details with a carousel', async ({
  world,
  loginAs,
  page,
}) => {
  const search = new SpotSearchPage(page);
  await loginAs(world.renter.email);
  await search.goto();
  await search.search(covered);
  const card = search.card(covered);
  await expect(card.locator('app-spot-features .size')).toHaveText('Pequena');
  await expect(card.locator('app-spot-features .coverage')).toHaveText('Coberta');
  await expect(card).not.toContainText('Pequena · Coberta');

  await card.click();
  await expect(page).toHaveURL(new RegExp(`/search/${coveredId}`));
  await expect(search.carousel).toBeVisible();
  const position = search.carousel.getByRole('status');
  await expect(position).toHaveText('Imagem 1 de 2');
  await search.next.click();
  await expect(position).toHaveText('Imagem 2 de 2');
  await search.carousel.getByRole('button', { name: 'Imagem anterior' }).click();
  await search.carousel.getByRole('button', { name: 'Mostrar imagem 2' }).click();
  await expect(position).toHaveText('Imagem 2 de 2');
  await search.back.click();
  await expect(page).toHaveURL(/\/search/);
});

test('a spot without photos has no carousel controls', async ({ world, loginAs, page }) => {
  const search = new SpotSearchPage(page);
  await loginAs(world.renter.email);
  await search.goto();
  await search.search(open);
  await expect(search.card(open).locator('app-spot-features .coverage')).toHaveText('Descoberta');
  await search.card(open).click();
  await expect(search.carousel).toBeVisible();
  await expect(search.next).toHaveCount(0);
});

test('details opened from Home go back to Home', async ({ world, loginAs, page }) => {
  await loginAs(world.renter.email);
  await expect(page).toHaveURL(/\/home/);
  await page.locator('app-spot-card a.card').first().click();
  await expect(page).toHaveURL(/\/search\/.+returnUrl/);
  await new SpotSearchPage(page).back.click();
  await expect(page).toHaveURL(/\/home$/);
});

test('filter dialog has labelled groups and narrows the results by coverage', async ({
  world,
  loginAs,
  page,
}) => {
  const search = new SpotSearchPage(page);
  await loginAs(world.renter.email);
  await search.goto();
  await search.search(open);
  await search.openFilters();
  await expect(search.dialog).toBeVisible();
  for (const group of ['Tamanho', 'Cobertura', 'Cobrança', 'Ordenar por']) {
    await expect(search.group(group)).toBeVisible();
  }
  await expect(search.group('Cobertura').getByRole('button')).toHaveText(['Qualquer', 'Coberta']);
  await expect(search.card(open)).toBeVisible();

  await search.choose('Cobertura', 'Coberta');
  await expect(search.empty).toBeVisible();
  await search.choose('Cobertura', 'Qualquer');
  await expect(search.card(open)).toBeVisible();
  await search.choose('Tamanho', 'Pequena');
  await expect(search.empty).toBeVisible();
});
