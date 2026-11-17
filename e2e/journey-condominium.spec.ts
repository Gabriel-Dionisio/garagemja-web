import { expect, test } from './fixtures';
import { dateIn, uniqueSpotNumber } from './support/api';
import { Journey } from './support/journey';
import { register, type Account } from './support/world';
import { PASSWORD, oobCodeFor, randomCnpj, randomCpf } from './support/real-api';

test.describe.configure({ mode: 'serial' });

let email: string;
let cnpj: string;
let name: string;
let spotNumber: string;
let user: Journey;
let joinCode: string;
let resident: Account;
let manager: Account;

test.beforeAll(async ({ window, baseURL }) => {
  user = await Journey.start(window, String(baseURL));
  const suffix = [...Date.now().toString(36)]
    .map((c) => String.fromCharCode(97 + (parseInt(c, 36) % 26)))
    .join('');
  email = `e2e.sindico.${Date.now().toString(36)}@email.com.br`;
  cnpj = randomCnpj();
  name = `Edificio Jornada ${suffix}`;
  spotNumber = uniqueSpotNumber('J');
  manager = { email, name: 'Sindico Da Jornada' };
});
test.afterEach(() => user.expectNoProblems());

test('sign up: every field is validated before anything is sent', async () => {
  const { page } = user;
  await user.shell.enter();
  await user.loginPage.goToRegister.click();
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByText('Campo obrigatório.').first()).toBeVisible();

  await page.getByLabel('Nome completo').fill('Maria');
  await page.getByLabel('E-mail').fill('sem-arroba');
  await page.getByLabel('Telefone').fill('1198');
  await page.getByLabel('CPF').fill('11111111111');
  await page.getByLabel('Senha', { exact: true }).fill('fraca');
  await page.getByLabel('Confirmar senha').fill('outra');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  for (const message of [
    'Informe nome e sobrenome usando apenas letras (espaços e apóstrofos são permitidos).',
    'Informe um e-mail válido.',
    'Telefone inválido. Informe DDD e número.',
    'CPF inválido.',
    'As senhas não coincidem',
  ]) {
    await expect(page.getByText(message).first()).toBeVisible();
  }
  for (const rule of ['De 8 a 20 caracteres', 'Uma letra maiúscula', 'Um número', 'Um símbolo']) {
    await expect(page.getByRole('listitem').filter({ hasText: rule })).toContainText(
      'não atendido',
    );
  }
  await expect(page).toHaveURL(/\/register(\?|$)/);
});

test('sign up: valid data creates the account, the e-mail link confirms it and login works', async ({
  request,
}) => {
  const { page } = user;
  await user.shell.enter();
  await user.loginPage.goToRegister.click();
  await page.getByLabel('Nome completo').fill('Sindico Da Jornada');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Telefone').fill('11987654321');
  await page.getByLabel('CPF').fill(randomCpf());
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirmar senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).click();

  expect((await user.registerPage.confirmEmail(await oobCodeFor(request, email))).status()).toBe(
    204,
  );
  await user.registerPage.goToLogin.click();
  await user.loginPage.email.fill(email);
  await user.loginPage.password.fill('senha-errada');
  await user.loginPage.submit.click();
  await expect(page.getByRole('alert')).toBeVisible();
  user.guard.allowApi(401, /\/auth\/login$/);
  user.guard.allowErrorAlerts();

  await user.loginPage.password.fill(PASSWORD);
  await user.loginPage.submit.click();
  await expect(page).toHaveURL(/\/condominiums$/);
  await expect(user.condominiums.welcome).toBeVisible();
});

test('register condominium: required fields and CNPJ are validated, then it waits for approval', async () => {
  const { page } = user;
  user.guard.allowApi(404, /\/condominiums\/cnpj\//);
  await user.shell.open('Condomínios');
  await user.condominiums.createLink.filter({ visible: true }).first().click();
  await page.getByRole('button', { name: 'Cadastrar condomínio' }).click();
  await expect(page.getByText('Campo obrigatório.').first()).toBeVisible();

  await page.getByLabel('CNPJ').fill('11222333000199');
  await page.getByLabel('CEP').fill('01310100');
  await page.getByLabel('Nome do condomínio').fill(name);
  await page.getByLabel('Endereço').fill('Rua da Jornada');
  await page.getByLabel('Número').fill('100');
  await page.getByLabel('Bairro').fill('Centro');
  await page.getByLabel('Cidade').fill('Sao Paulo');
  await page.getByLabel('UF').fill('SP');
  await page.getByRole('button', { name: 'Cadastrar condomínio' }).click();
  await expect(page.getByText('CNPJ inválido.')).toBeVisible();

  await page.getByLabel('CNPJ').fill(cnpj);
  await page.getByRole('button', { name: 'Cadastrar condomínio' }).click();
  await expect(page).toHaveURL(/\/condominiums\/[0-9a-f-]{36}/);
  await expect(page.getByText('Aguardando aprovação').first()).toBeVisible();
});

test('admin reviews the request and approves it', async ({ world }) => {
  const { page } = user;
  await user.actAs(world.admin);
  await user.openCondominium(name);
  await expect(page.getByText('Aguardando aprovação').first()).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await user.confirm.confirm('Aprovar');
  await expect(page.getByText('Ativo', { exact: true }).first()).toBeVisible();
});

test('manager of the new condominium finds the invite code on the residents tab', async () => {
  const { page } = user;
  await user.actAs(manager);
  await user.openCondominium(name, 'Moradores');
  await expect(page.getByTestId('join-code')).toHaveText(/^[A-Z0-9]{6,10}$/);
  joinCode = (await page.getByTestId('join-code').innerText()).trim();
});

test('resident joins with the code: wrong code and missing unit are caught', async ({
  baseURL,
}) => {
  const { page } = user;
  resident = await register(String(baseURL), 'Morador Da Jornada', 'resident');
  await user.actAs(resident);
  await user.shell.open('Condomínios');
  await expect(user.condominiums.welcome).toBeVisible();
  await page.getByText('Tenho um código').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Código do condomínio').fill('ZZZZZZZZZZ');
  await expect(dialog.getByText('Código de entrada inválido ou expirado.')).toBeVisible();
  user.guard.allowErrorAlerts();
  user.guard.allowApi(404, /\/joins\//);

  await dialog.getByLabel('Código do condomínio').fill(joinCode);
  await expect(dialog.getByText(new RegExp(name, 'i'))).toBeVisible();
  await dialog.getByRole('button', { name: 'Pedir para entrar' }).click();
  await expect(dialog.getByText('Campo obrigatório.')).toBeVisible();

  await dialog.getByLabel('Unidade').fill('201');
  await dialog.getByLabel('Bloco (opcional)').fill('B');
  await dialog.getByRole('button', { name: 'Pedir para entrar' }).click();
  await expect(page.getByText('Pedido enviado. Aguarde a aprovação do síndico.')).toBeVisible();
});

test('manager approves the resident request', async () => {
  const { page } = user;
  await user.actAs(manager);
  await user.openCondominium(name, 'Moradores');
  await expect(page.getByText('Morador da Jornada')).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar: Morador da Jornada' }).click();
  const row = page.getByRole('listitem').filter({ hasText: 'Morador da Jornada' });
  await expect(row).toContainText('Aprovado');
  await expect(page.getByRole('button', { name: /^Aprovar:/ })).toHaveCount(0);
});

test('manager sets the rules: invalid values are blocked, valid ones are saved', async () => {
  const { page } = user;
  await user.openCondominium(name, 'Regras');
  await page.getByLabel('Preço máximo por dia (R$)').fill('0');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Informe um valor maior que zero.').first()).toBeVisible();

  await page.getByLabel('Preço máximo por dia (R$)').fill('50');
  await page.getByLabel('Máximo de dias por aluguel').fill('10');
  await page.getByLabel('Prazo para cancelar (horas antes)').fill('24');
  await page.getByRole('switch', { name: 'Permitir aluguel por hora' }).click();
  await page.getByLabel('Preço máximo por hora (R$)').fill('8');
  await page.getByLabel('Mínimo de horas por aluguel').fill('2');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Regras salvas.')).toBeVisible();
});

test('manager manages the condominium photos: upload, reorder, save, remove', async () => {
  const { page, gallery } = user;
  const save = page.getByRole('button', { name: 'Salvar' });
  await user.openCondominium(name);
  await expect(page.getByText('Nenhuma imagem ainda')).toBeVisible();

  await gallery.upload(40, 120, 200);
  await expect(gallery.counter).toHaveText('1 / 4');
  await expect(gallery.cover).toBeVisible();
  await gallery.next();
  await gallery.makeCover();
  await expect(gallery.counter).toHaveText('2 / 4');
  await save.click();
  await expect(page.getByText('Alterações salvas.')).toBeVisible();

  await page.reload();
  await expect(gallery.counter).toHaveText('1 / 4');
  await gallery.next();
  await gallery.removeCurrent();
  await expect(gallery.counter).toHaveText('2 / 3');
  await save.click();
  await expect(page.getByText('Alterações salvas.')).toBeVisible();

  await page.reload();
  await expect(gallery.counter).toHaveText('1 / 3');
});

test('resident asks for a spot: the form validates and a repeated number is refused', async () => {
  const { page } = user;
  await user.actAs(resident);
  await user.mySpots.goto();
  await user.mySpots.startNewSpot();
  await page.getByRole('button', { name: 'Enviar pedido' }).click();
  await expect(page.getByText('Campo obrigatório.').first()).toBeVisible();

  await user.spotForm.fill(spotNumber, 'Subsolo 1', 'Média');
  await expect(user.spotForm.coverage('Descoberta')).toHaveAttribute('aria-pressed', 'true');
  await user.spotForm.coverage('Coberta').click();
  await expect(user.spotForm.coverage('Coberta')).toHaveAttribute('aria-pressed', 'true');
  await expect(user.spotForm.coverage('Descoberta')).toHaveAttribute('aria-pressed', 'false');
  await user.spotForm.sendRequest.click();
  await expect(page).toHaveURL(/\/parking-spots$/);
  await user.mySpots.search(spotNumber);
  await expect(user.mySpots.spot(spotNumber)).toContainText('Pendente');

  await user.mySpots.startNewSpot();
  await user.spotForm.fill(spotNumber, 'Subsolo 2', 'Pequena');
  await user.spotForm.sendRequest.click();
  await expect(page.getByRole('alert')).toContainText('Já existe uma vaga com o número');
  user.guard.allowApi(409, /\/parking-spots$/);
  user.guard.allowErrorAlerts();
});

test('manager approves the spot and the resident sees it active', async () => {
  const { page } = user;
  await user.actAs(manager);
  await user.condominiumSpots.goto(name);
  await user.condominiumSpots.search(spotNumber);
  await expect(user.condominiumSpots.spot(spotNumber)).toContainText('Pendente');
  await user.condominiumSpots.approve(spotNumber);
  await expect(user.condominiumSpots.spot(spotNumber)).toContainText('Ativa');

  await user.actAs(resident);
  await user.mySpots.goto();
  await user.mySpots.search(spotNumber);
  await expect(user.mySpots.spot(spotNumber)).toContainText('Sem disponibilidade');
  await expect(user.mySpots.spot(spotNumber)).not.toContainText('Pendente');
  await expect(page).toHaveURL(/\/parking-spots/);
});

test('owner sets availability: bad periods and prices are refused, a good one is listed', async () => {
  const { page } = user;
  await user.mySpots.open(spotNumber);
  await expect(user.availability.addButton).toBeEnabled();
  await user.availability.addButton.click();
  await page.getByRole('button', { name: 'Adicionar período' }).click();
  await expect(user.availability.priceMissing).toBeVisible();

  await user.availability.fillDialog({ start: dateIn(5), end: dateIn(2), daily: '20,00' });
  await page.getByRole('button', { name: 'Adicionar período' }).click();
  await expect(
    page.getByText('Informe o período; o fim não pode ser antes do início.'),
  ).toBeVisible();

  await user.availability.fillDialog({ start: dateIn(2), end: dateIn(8), daily: '80,00' });
  await page.getByRole('button', { name: 'Adicionar período' }).click();
  await expect(page.getByRole('alert')).toContainText('excede o limite do condomínio');
  user.guard.allowErrorAlerts();
  user.guard.allowApi(400, /\/spot-availabilities$/);
  user.guard.allowApi(422, /\/spot-availabilities$/);

  await user.availability.addButton.click();
  await user.availability.fillDialog({ start: dateIn(2), end: dateIn(8), daily: '45,00' });
  await page.getByRole('button', { name: 'Adicionar período' }).click();
  await expect(user.availability.period(dateIn(2))).toContainText('45,00');
});

test('owner edits, deactivates and removes the period', async () => {
  const { page } = user;
  const start = dateIn(2);

  await user.availability.edit(start, { daily: '80,00' });
  await expect(page.getByRole('alert')).toContainText('excede o limite do condomínio');
  user.guard.allowErrorAlerts();
  user.guard.allowApi(400, /\/spot-availabilities\//);
  user.guard.allowApi(422, /\/spot-availabilities\//);
  await expect(user.availability.period(start)).toContainText('45,00');

  await user.availability.edit(start, { daily: '40,00' });
  await expect(user.availability.dialog).toBeHidden();
  await expect(user.availability.period(start)).toContainText('40,00');

  await user.availability.activeSwitch(start).click();
  await expect(user.availability.activeSwitch(start)).not.toBeChecked();
  await page.reload();
  await expect(user.availability.activeSwitch(start)).not.toBeChecked();

  await user.availability.remove(start);
  await expect(user.availability.emptyText).toBeVisible();
});

test('owner manages the spot photos: upload, carousel, add one more, remove', async () => {
  const { page, gallery } = user;
  const save = page.getByRole('button', { name: 'Salvar' });
  await user.mySpots.goto();
  await user.mySpots.search(spotNumber);
  await user.mySpots.open(spotNumber);
  await expect(page.getByText('Nenhuma imagem ainda')).toBeVisible();

  await gallery.upload(60, 150);
  await expect(gallery.counter).toHaveText('1 / 3');
  await gallery.next();
  await expect(gallery.counter).toHaveText('2 / 3');
  await gallery.previous();
  await expect(page.getByRole('button', { name: 'Mover para trás' })).toHaveCount(0);
  await save.click();
  await expect(save).toBeHidden();

  await user.mySpots.goto();
  await user.mySpots.search(spotNumber);
  await user.mySpots.open(spotNumber);
  await expect(gallery.counter).toHaveText('1 / 3');
  await gallery.next();
  await gallery.next();
  await gallery.upload(220);
  await expect(gallery.counter).toHaveText('3 / 4');
  await gallery.previous();
  await gallery.removeCurrent();
  await expect(gallery.counter).toHaveText('2 / 3');
  await save.click();
  await expect(save).toBeHidden();

  await user.mySpots.goto();
  await user.mySpots.search(spotNumber);
  await user.mySpots.open(spotNumber);
  await expect(gallery.counter).toHaveText('1 / 3');
  await expect(page.getByRole('button', { name: 'Definir como capa' })).toHaveCount(0);
  await expect(save).toBeHidden();
  await gallery.next();
  await gallery.makeCover();
  await expect(save).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cancelar', exact: true })).toBeVisible();
});
