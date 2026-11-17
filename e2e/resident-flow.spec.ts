import { expect, test } from './fixtures';
import { oobCodeFor, uniqueEmail } from './support/real-api';

test.describe.configure({ mode: 'serial' });

const email = uniqueEmail('resident');

test('resident signs up, confirms via Mailpit and lands on the welcome cards', async ({
  page,
  request,
  registerPage,
  loginPage,
  condominiums,
}) => {
  expect((await registerPage.register(email)).status()).toBe(202);
  expect((await registerPage.confirmEmail(await oobCodeFor(request, email))).status()).toBe(204);
  await registerPage.goToLogin.click();
  await expect(page).toHaveURL(/\/login/);
  expect((await loginPage.login(email)).status()).toBe(200);
  await expect(page).toHaveURL(/\/condominiums$/);
  await expect(condominiums.welcome).toBeVisible();
  await expect(page.getByText('Tenho um código')).toBeVisible();
  await expect(page.getByText('Procurar meu condomínio')).toBeVisible();
  await expect(page.getByText('Cadastrar meu condomínio')).toBeVisible();
});

for (const path of ['/admin/users', '/admin/users/new', '/admin/audit-logs']) {
  test(`resident is kept out of ${path}`, async ({ page, loginAs, shell }) => {
    await loginAs(email);
    await shell.goto(path);
    await expect(page).not.toHaveURL(new RegExp(`${path}$`));
  });
}

test('resident shell pages share one content width and never overflow', async ({
  page,
  loginAs,
  shell,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await loginAs(email);
  const widths: Record<string, number> = {};
  for (const path of ['/home', '/condominiums', '/dashboard']) {
    await shell.goto(path);
    const box = await shell.content.boundingBox();
    widths[path] = Math.round(box?.width ?? 0);
    expect.soft(await shell.hasHorizontalOverflow(), `${path} overflows horizontally`).toBe(false);
  }
  test.info().annotations.push({ type: 'widths', description: JSON.stringify(widths) });
  expect.soft(new Set(Object.values(widths)).size, JSON.stringify(widths)).toBe(1);
});
