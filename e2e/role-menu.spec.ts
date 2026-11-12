import { Page, expect, test } from '@playwright/test';

type Role = 'ADMIN' | 'CONDOMINIUM_ADMIN' | 'RESIDENT';

async function mockApi(page: Page, role: Role, pendingResidents = 0) {
  const json = (body: unknown) => ({ contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) {
      return route.fulfill(
        json({ id: 'u1', name: 'Teste', email: 'teste@example.test', roles: [role] }),
      );
    }
    if (path.endsWith('/me/managed-condominiums')) {
      return route.fulfill({
        ...json([{ id: 'c1', name: 'Edifício A', status: 'ACTIVE', pendingResidents }]),
        headers: { 'X-Total-Count': '1' },
      });
    }
    if (path.endsWith('/condominiums/c1')) {
      return route.fulfill(
        json({
          id: 'c1',
          name: 'Edifício A',
          cnpj: '11222333000181',
          status: 'ACTIVE',
          canManage: role === 'CONDOMINIUM_ADMIN',
          createdAt: '2026-11-01T10:00:00Z',
          contacts: [],
        }),
      );
    }
    if (path.endsWith('/counts')) {
      return route.fulfill(json({ residents: 1, parkingSpots: 1, activeRentals: 0 }));
    }
    if (path.endsWith('/images') || path.endsWith('/manager-invites'))
      return route.fulfill(json([]));
    return route.fulfill({ status: 204 });
  });
}

const menu = (page: Page) => page.getByRole('navigation', { name: 'Principal' }).getByRole('link');

test.use({ viewport: { width: 1280, height: 900 } });

test('resident menu has Início and Condomínios only', async ({ page }) => {
  await mockApi(page, 'RESIDENT');
  await page.goto('/home');
  await expect(menu(page).filter({ hasText: 'Condomínios' })).toBeVisible();
  await expect(menu(page).filter({ hasText: 'Início' })).toBeVisible();
  await expect(menu(page).filter({ hasText: 'Painel' })).toHaveCount(0);
  await expect(menu(page).filter({ hasText: 'Histórico' })).toHaveCount(0);
});

test('manager menu adds Painel and shows the pending residents badge', async ({ page }) => {
  await mockApi(page, 'CONDOMINIUM_ADMIN', 3);
  await page.goto('/home');
  await expect(menu(page).filter({ hasText: 'Painel' })).toBeVisible();
  await expect(menu(page).filter({ hasText: 'Condomínios' })).toContainText('3');
  await expect(menu(page).filter({ hasText: 'Usuários' })).toHaveCount(0);
});

test('admin menu has Painel, Condomínios, Usuários and Auditoria without Início', async ({
  page,
}) => {
  await mockApi(page, 'ADMIN');
  await page.goto('/home');
  await expect(page).toHaveURL(/\/dashboard$/);
  for (const name of ['Painel', 'Condomínios', 'Usuários', 'Auditoria']) {
    await expect(menu(page).filter({ hasText: name })).toBeVisible();
  }
  await expect(menu(page).filter({ hasText: 'Início' })).toHaveCount(0);
});

test('admin has no create or join buttons on the condominiums list', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await page.goto('/condominiums');
  await expect(page.getByRole('heading', { name: 'Condomínios' }).first()).toBeVisible();
  await expect(page.getByText('Entrar com código')).toHaveCount(0);
  await expect(page.locator('a[href="/condominiums/new"]')).toHaveCount(0);
});

test('guards keep each role out of screens it does not use', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await page.goto('/condominiums/new');
  await expect(page).not.toHaveURL(/\/condominiums\/new$/);
  await page.goto('/condominiums/c1/residents');
  await expect(page).not.toHaveURL(/\/residents$/);
});

test('resident cannot open the residents or managers tabs', async ({ page }) => {
  await mockApi(page, 'RESIDENT');
  await page.goto('/condominiums/c1/residents');
  await expect(page).not.toHaveURL(/\/residents$/);
  await page.goto('/condominiums/c1/managers');
  await expect(page).not.toHaveURL(/\/managers$/);
});

test('manager sees the history as a tab of the condominium', async ({ page }) => {
  await mockApi(page, 'CONDOMINIUM_ADMIN');
  await page.goto('/condominiums/c1');
  await expect(
    page
      .getByRole('navigation', { name: 'Seções do condomínio' })
      .getByRole('link', { name: 'Histórico' }),
  ).toBeVisible();
  await expect(menu(page).filter({ hasText: 'Histórico' })).toHaveCount(0);
});
