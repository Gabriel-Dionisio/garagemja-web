import { expect, test } from './fixtures';
import { uniqueSpotNumber } from './support/api';

test.describe('manager reviews spot requests on the Vagas tab', () => {
  let number: string;

  test.beforeEach(async ({ world, loginAs, condominiumSpots }) => {
    number = uniqueSpotNumber('REV');
    await (await world.as(world.owner)).createSpot(world.condominium.id, number, 'SMALL');
    await loginAs(world.manager.email);
    await condominiumSpots.goto(world.condominium.name);
    await condominiumSpots.search(number);
    await expect(condominiumSpots.spot(number)).toContainText('Pendente');
  });

  test('approves a pending spot', async ({ condominiumSpots }) => {
    await condominiumSpots.approve(number);
    await expect(condominiumSpots.spot(number)).toContainText('Ativa');
    await expect(
      condominiumSpots.spot(number).getByRole('button', { name: /^Aprovar/ }),
    ).toHaveCount(0);
  });

  test('rejects a pending spot with a reason', async ({ condominiumSpots }) => {
    await condominiumSpots.reject(number, 'E2E: vaga inexistente');
    await expect(condominiumSpots.spot(number)).toContainText('Rejeitada');
    await expect(condominiumSpots.spot(number)).toContainText('Motivo: E2E: vaga inexistente');
  });

  test('status filter hides the spot once it is no longer pending', async ({
    condominiumSpots,
  }) => {
    await condominiumSpots.filterStatus('Pendentes');
    await expect(condominiumSpots.spot(number)).toBeVisible();
    await condominiumSpots.approve(number);
    await expect(condominiumSpots.spot(number)).toHaveCount(0);
    await condominiumSpots.filterStatus('Ativas');
    await expect(condominiumSpots.spot(number)).toBeVisible();
  });
});

test.describe('manager blocks an active spot of an owner', () => {
  let number: string;

  test.beforeEach(async ({ world }) => {
    number = uniqueSpotNumber('BLK');
    await (
      await world.as(world.manager)
    ).createSpot(world.condominium.id, number, 'SMALL', world.ownerResidentId);
  });

  test('blocks with a reason and the owner sees it', async ({
    world,
    loginAs,
    condominiumSpots,
    mySpots,
  }) => {
    await loginAs(world.manager.email);
    await condominiumSpots.goto(world.condominium.name);
    await condominiumSpots.search(number);
    await condominiumSpots.block(number, 'E2E: obra na garagem');
    await expect(condominiumSpots.spot(number)).toContainText('Bloqueada');
    await expect(condominiumSpots.spot(number)).toContainText('Motivo: E2E: obra na garagem');

    await loginAs(world.owner.email);
    await mySpots.goto();
    await mySpots.search(number);
    await expect(mySpots.spot(number)).toContainText('Motivo: E2E: obra na garagem');
  });

  test('manager only reads the availability of an owned spot', async ({
    world,
    loginAs,
    spotForm,
    availability,
  }) => {
    await loginAs(world.manager.email);
    await spotForm.openManaged(world.condominium.name, number);
    await expect(availability.ownerOnly).toBeVisible();
    await expect(availability.addButton).toHaveCount(0);
  });
});
