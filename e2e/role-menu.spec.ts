import { expect, test } from './fixtures';
import { mockApi } from './support/mock-api';

test.use({ viewport: { width: 1280, height: 900 } });

test('resident menu has Início, Condomínios and Painel without manager items', async ({
  page,
  shell,
}) => {
  await mockApi(page, 'RESIDENT');
  await shell.goto('/home');
  await expect(shell.menuItem('Condomínios')).toBeVisible();
  await expect(shell.menuItem('Início')).toBeVisible();
  await expect(shell.menuItem('Painel')).toBeVisible();
  await expect(shell.menuItem('Histórico')).toHaveCount(0);
});

test('manager menu adds Painel and shows the pending residents badge', async ({ page, shell }) => {
  await mockApi(page, 'CONDOMINIUM_ADMIN', { pendingResidents: 3 });
  await shell.goto('/home');
  await expect(shell.menuItem('Painel')).toBeVisible();
  await expect(shell.menuItem('Condomínios')).toContainText('3');
  await expect(shell.menuItem('Usuários')).toHaveCount(0);
});

test('admin menu has Painel, Condomínios, Usuários and Auditoria without Início', async ({
  page,
  shell,
}) => {
  await mockApi(page, 'ADMIN');
  await shell.goto('/home');
  await expect(page).toHaveURL(/\/dashboard$/);
  for (const name of ['Painel', 'Condomínios', 'Usuários', 'Auditoria']) {
    await expect(shell.menuItem(name)).toBeVisible();
  }
  await expect(shell.menuItem('Início')).toHaveCount(0);
});

test('admin has no create or join buttons on the condominiums list', async ({
  page,
  condominiums,
}) => {
  await mockApi(page, 'ADMIN');
  await condominiums.goto();
  await expect(condominiums.heading).toBeVisible();
  await expect(condominiums.joinWithCode).toHaveCount(0);
  await expect(condominiums.createLink).toHaveCount(0);
});

test('guards keep each role out of screens it does not use', async ({ page, shell }) => {
  await mockApi(page, 'ADMIN');
  await shell.goto('/condominiums/new');
  await expect(page).not.toHaveURL(/\/condominiums\/new$/);
  await shell.goto('/condominiums/c1/residents');
  await expect(page).not.toHaveURL(/\/residents$/);
});

test('resident cannot open the residents or managers tabs', async ({ page, condominiumDetail }) => {
  await mockApi(page, 'RESIDENT');
  await condominiumDetail.goto('c1', 'residents');
  await expect(page).not.toHaveURL(/\/residents$/);
  await condominiumDetail.goto('c1', 'managers');
  await expect(page).not.toHaveURL(/\/managers$/);
});

test('manager sees the history as a tab of the condominium', async ({
  page,
  shell,
  condominiumDetail,
}) => {
  await mockApi(page, 'CONDOMINIUM_ADMIN');
  await condominiumDetail.goto('c1');
  await expect(condominiumDetail.tab('Histórico')).toBeVisible();
  await expect(shell.menuItem('Histórico')).toHaveCount(0);
});
