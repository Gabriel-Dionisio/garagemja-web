import { expect, test } from './fixtures';
import { DashboardPage } from './pages/dashboard.page';
import { ShellPage } from './pages/shell.page';

const RENTALS = /\/api\/v1\/stats\/me\/rentals/;
const WALLET = /\/api\/v1\/stats\/me\/wallet/;

test('dashboard: the rentals chart renders and changing the period fetches again', async ({
  world,
  loginAs,
  page,
}) => {
  await loginAs(world.owner.email);
  const first = page.waitForResponse(RENTALS);
  await new DashboardPage(page).goto();
  const initial = (await first).url();
  const card = page.locator('app-period-chart').filter({ hasText: 'Aluguéis por período' });
  await expect(card.getByRole('heading', { name: 'Aluguéis por período' })).toBeVisible();
  const periods = card.getByRole('group', { name: 'Agrupar por' });
  await expect(periods.getByRole('button', { name: 'Mês' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const next = page.waitForResponse(RENTALS);
  await periods.getByRole('button', { name: 'Bimestre' }).click();
  expect((await next).url()).not.toBe(initial);
  await expect(periods.getByRole('button', { name: 'Bimestre' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('dashboard: a failing stats call shows an error inside the chart card', async ({
  world,
  loginAs,
  page,
  guard,
}) => {
  guard.allowApi(500, RENTALS);
  guard.allowErrorAlerts();
  await loginAs(world.owner.email);
  await page.route(RENTALS, (route) => route.fulfill({ status: 500, body: '{}' }));
  await new DashboardPage(page).goto();
  const card = page.locator('app-period-chart').filter({ hasText: 'Aluguéis por período' });
  await expect(card.locator('app-alert[data-kind="error"]')).toBeVisible();
});

test('wallet: the flow chart renders and changing the period fetches again', async ({
  world,
  loginAs,
  page,
}) => {
  await loginAs(world.owner.email);
  const first = page.waitForResponse(WALLET);
  await new ShellPage(page).open('Carteira');
  const initial = (await first).url();
  const card = page.locator('app-period-chart').filter({ hasText: 'Entradas e saídas' });
  await expect(card.getByRole('heading', { name: 'Entradas e saídas' })).toBeVisible();

  const next = page.waitForResponse(WALLET);
  await card.getByRole('button', { name: 'Ano' }).click();
  expect((await next).url()).not.toBe(initial);
});

test('wallet: a failing flow call shows an error inside the chart card', async ({
  world,
  loginAs,
  page,
  guard,
}) => {
  guard.allowApi(500, WALLET);
  guard.allowErrorAlerts();
  await loginAs(world.owner.email);
  await page.route(WALLET, (route) => route.fulfill({ status: 500, body: '{}' }));
  await new ShellPage(page).open('Carteira');
  const card = page.locator('app-period-chart').filter({ hasText: 'Entradas e saídas' });
  await expect(card.locator('app-alert[data-kind="error"]')).toBeVisible();
});
