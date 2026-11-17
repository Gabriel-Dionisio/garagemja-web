import { expect, test } from './fixtures';
import { ImageGallery } from './pages/image-gallery';
import { VehiclesPage } from './pages/vehicles.page';
import type { World } from './support/world';
import { randomPlate } from './support/world';

let counter = 0;

async function newVehicle(world: World, brand: string) {
  const model = `Mod${Date.now().toString(36).slice(-4)}${counter++}`;
  const renter = await world.as(world.renter);
  const { id } = await renter.send<{ id: string }>('POST', '/api/v1/vehicles', {
    residentId: world.renterResidentId,
    plate: randomPlate(),
    brand,
    model,
    color: 'Prata',
  });
  return { id, model, title: `${brand} ${model}`, renter };
}

test('vehicle item is a link, edit shows Voltar until something changes, then Cancelar and Salvar', async ({
  world,
  loginAs,
  page,
}) => {
  const { id, title } = await newVehicle(world, 'Edit');
  const vehicles = new VehiclesPage(page);
  await loginAs(world.renter.email);
  await vehicles.goto();
  await vehicles.vehicle(title).locator('a.main').click();
  await expect(page).toHaveURL(new RegExp(`/vehicles/${id}$`));
  await expect(vehicles.back).toBeVisible();
  await expect(vehicles.save).toHaveCount(0);

  await vehicles.color.fill('Preto');
  await expect(vehicles.cancel).toBeVisible();
  await expect(vehicles.back).toHaveCount(0);

  await vehicles.color.fill('Preto');
  await vehicles.save.click();
  await expect(page).toHaveURL(/\/vehicles$/);
  await expect(vehicles.vehicle(title)).toContainText('Preto');
});

test('an invalid plate keeps the form open and nothing is saved', async ({
  world,
  loginAs,
  page,
}) => {
  const { title } = await newVehicle(world, 'Plac');
  const vehicles = new VehiclesPage(page);
  await loginAs(world.renter.email);
  await vehicles.goto();
  await vehicles.edit(title).click();
  await vehicles.plate.fill('AB');
  await vehicles.save.click();
  await expect(page.getByText('Informe uma placa válida (AAA1234 ou AAA1A23).')).toBeVisible();
  await expect(page).toHaveURL(/\/vehicles\/.+/);
});

test('edit and delete icons act on the vehicle', async ({ world, loginAs, page }) => {
  const { id, title } = await newVehicle(world, 'Icon');
  const vehicles = new VehiclesPage(page);
  await loginAs(world.renter.email);
  await vehicles.goto();
  await vehicles.edit(title).click();
  await expect(page).toHaveURL(new RegExp(`/vehicles/${id}$`));
  await vehicles.back.click();

  await vehicles.remove(title).click();
  await vehicles.confirmDialog.confirm('Excluir');
  await expect(vehicles.vehicle(title)).toHaveCount(0);
});

test('vehicle photos: up to five are kept and the sixth is refused by the API', async ({
  world,
  loginAs,
  page,
}) => {
  const { id, title, renter } = await newVehicle(world, 'Foto');
  const vehicles = new VehiclesPage(page);
  const gallery = new ImageGallery(page);
  await loginAs(world.renter.email);
  await vehicles.goto();
  await vehicles.edit(title).click();
  await gallery.upload(30, 60, 90, 120, 150);
  await expect(gallery.counter).toHaveText('1 / 5');
  await expect(vehicles.photos).toBeVisible();
  await vehicles.save.click();
  await expect(page).toHaveURL(/\/vehicles$/);

  await vehicles.edit(title).click();
  await expect(gallery.counter).toHaveText('1 / 5');
  expect(await renter.uploadImage(`/api/v1/vehicles/${id}/images`, 200)).toBe(409);
});
