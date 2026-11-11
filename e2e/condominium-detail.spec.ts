import { Page, expect, test } from '@playwright/test';

const condominium = {
  id: 'c1',
  name: 'Edifício A',
  cnpj: '11222333000181',
  status: 'ACTIVE',
  canManage: false,
  contacts: [],
  createdAt: '2026-11-01T10:00:00Z',
};

async function mockApi(page: Page) {
  const json = (body: unknown) => ({ contentType: 'application/json', body: JSON.stringify(body) });
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) {
      return route.fulfill(
        json({ id: 'a1', name: 'Admin', email: 'admin@example.test', roles: ['ADMIN'] }),
      );
    }
    if (path.endsWith('/counts')) {
      return route.fulfill(json({ residents: 12, parkingSpots: 7, activeRentals: 3 }));
    }
    if (path.endsWith('/images') || path.endsWith('/manager-invites')) {
      return route.fulfill(json([]));
    }
    if (path.endsWith('/condominiums/c1')) return route.fulfill(json(condominium));
    return route.fulfill({ status: 204 });
  });
}

for (const width of [375, 768, 1280]) {
  test(`admin moderation view at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page);
    await page.goto('/condominiums/c1');
    await expect(page.locator('.counts')).toContainText('12');
    await expect(page.getByRole('link', { name: 'Histórico' })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    await page.mouse.move(width - 1, 450);
    await page.screenshot({ path: `e2e/.results/detail-${width}.png`, fullPage: false });
  });
}
