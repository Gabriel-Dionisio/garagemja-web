import { expect, test } from './fixtures';
import { dateIn, uniqueSpotNumber, type Api } from './support/api';

let manager: Api;
let condominiumId: string;
let spotId: string;
let number: string;

test.beforeEach(async ({ world, loginAs, spotForm, availability }) => {
  manager = await world.as(world.manager);
  condominiumId = world.condominium.id;
  number = uniqueSpotNumber('AV');
  spotId = (await manager.createSpot(condominiumId, number)).id;
  await loginAs(world.manager.email);
  await spotForm.openManaged(world.condominium.name, number);
  await expect(availability.addButton).toBeEnabled();
});

test('creates a period with only the daily price', async ({ availability }) => {
  const start = dateIn(3);
  await availability.add({ start, end: dateIn(10), daily: '15,00' });
  await expect(availability.dialog).toBeHidden();
  await expect(availability.period(start)).toContainText('15,00/dia');
  await expect(availability.period(start)).not.toContainText('/hora');
});

test('creates a period with only the hourly price', async ({ availability }) => {
  const start = dateIn(4);
  await availability.add({ start, end: dateIn(12), hourly: '4,50', from: '8', to: '18' });
  await expect(availability.dialog).toBeHidden();
  await expect(availability.period(start)).toContainText('4,50/hora');
  await expect(availability.period(start)).toContainText('8h às 18h');
  await expect(availability.period(start)).not.toContainText('/dia');
});

test('requires at least one price', async ({ availability }) => {
  await availability.add({ start: dateIn(5), end: dateIn(8) });
  await expect(availability.priceMissing).toBeVisible();
  await expect(availability.dialog).toBeVisible();
  await availability.dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(availability.emptyText).toBeVisible();
});

test.describe('existing period', () => {
  const start = dateIn(2);

  test.beforeEach(async ({ page, availability }) => {
    await manager.addAvailability(spotId, 10, 2, 20);
    await page.reload();
    await expect(availability.period(start)).toContainText('10,00/dia');
  });

  test('deactivates and reactivates it', async ({ page, availability }) => {
    await expect(availability.activeSwitch(start)).toBeChecked();
    await availability.activeSwitch(start).click();
    await expect(availability.activeSwitch(start)).not.toBeChecked();
    await page.reload();
    await expect(availability.activeSwitch(start)).not.toBeChecked();
    await availability.activeSwitch(start).click();
    await expect(availability.activeSwitch(start)).toBeChecked();
  });

  test('edits the price', async ({ availability }) => {
    await availability.edit(start, { daily: '22,00' });
    await expect(availability.dialog).toBeHidden();
    await expect(availability.period(start)).toContainText('22,00/dia');
  });

  test('removes it', async ({ availability }) => {
    await availability.remove(start);
    await expect(availability.emptyText).toBeVisible();
  });
});
