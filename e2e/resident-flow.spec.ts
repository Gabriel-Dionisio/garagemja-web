import { expect, test } from '@playwright/test';
import {
  confirmEmail,
  goToLoginFromConfirmation,
  login,
  oobCodeFor,
  registerResident,
  uniqueEmail,
} from './support/real-api';

test.describe.configure({ mode: 'serial' });

const email = uniqueEmail('resident');

test('resident signs up, confirms via Mailpit and lands on the welcome cards', async ({
  page,
  request,
}) => {
  await registerResident(page, email);
  await confirmEmail(page, await oobCodeFor(request, email));
  await goToLoginFromConfirmation(page);
  await login(page, email);
  await expect(page).toHaveURL(/\/condominiums$/);
  await expect(page.getByRole('heading', { name: /Bem-vindo/ })).toBeVisible();
  await expect(page.getByText('Tenho um código')).toBeVisible();
  await expect(page.getByText('Procurar meu condomínio')).toBeVisible();
  await expect(page.getByText('Cadastrar meu condomínio')).toBeVisible();
});

for (const path of ['/admin/users', '/admin/users/new', '/admin/audit-logs']) {
  test(`resident is kept out of ${path}`, async ({ page }) => {
    await login(page, email);
    await page.goto(path);
    await expect(page).not.toHaveURL(new RegExp(`${path}$`));
  });
}

test('resident shell pages share one content width and never overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page, email);
  const widths: Record<string, number> = {};
  for (const path of ['/home', '/condominiums', '/dashboard']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const box = await page.locator('main > *:not(router-outlet)').first().boundingBox();
    widths[path] = Math.round(box?.width ?? 0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect.soft(overflow, `${path} overflows horizontally`).toBe(false);
  }
  test.info().annotations.push({ type: 'widths', description: JSON.stringify(widths) });
  expect.soft(new Set(Object.values(widths)).size, JSON.stringify(widths)).toBe(1);
});
