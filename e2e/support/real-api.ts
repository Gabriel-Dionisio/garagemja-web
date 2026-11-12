import { expect, type APIRequestContext, type Page } from '@playwright/test';

const MAILPIT = 'http://localhost:8025/api/v1';
export const PASSWORD = 'Senha@123';

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}${Math.floor(Math.random() * 1000)}@garagemja.test`;
}

export function cpfFromBase(base: number[]): string {
  const digit = (digits: number[]) => {
    const sum = digits.reduce((acc, d, i) => acc + d * (digits.length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const digits = [...base];
  digits.push(digit(digits));
  digits.push(digit(digits));
  return digits.join('');
}

export function randomCpf(): string {
  return cpfFromBase(Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)));
}

export async function registerResident(page: Page, email: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Nome completo').fill('Teste Playwright Silva');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Telefone').fill('11987654321');
  await page.getByLabel('CPF').fill(randomCpf());
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirmar senha').fill(PASSWORD);
  const response = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/register'));
  await page.getByRole('button', { name: 'Criar conta' }).click();
  expect((await response).status()).toBe(202);
}

export async function oobCodeFor(request: APIRequestContext, email: string): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(
      async () => {
        const search = await request.get(`${MAILPIT}/search`, { params: { query: `to:${email}` } });
        const [message] = (await search.json()).messages ?? [];
        if (!message) return undefined;
        const detail = await (await request.get(`${MAILPIT}/message/${message.ID}`)).json();
        code = /oobCode=([^&"'\s]+)/.exec(detail.HTML ?? detail.Text)?.[1];
        return code;
      },
      { timeout: 30_000, message: `verification e-mail for ${email}` },
    )
    .toBeTruthy();
  return decodeURIComponent(code!);
}

export async function confirmEmail(page: Page, code: string): Promise<void> {
  const response = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/verify-email'));
  await page.goto(`/confirm-email?oobCode=${encodeURIComponent(code)}`);
  expect((await response).status()).toBe(204);
}

export async function goToLoginFromConfirmation(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Ir para o login' }).click();
  await expect(page).toHaveURL(/\/login/);
}

export async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
  const response = page.waitForResponse((r) => r.url().endsWith('/api/v1/auth/login'));
  await page.getByRole('button', { name: 'Entrar' }).click();
  expect((await response).status()).toBe(200);
  await expect(page).not.toHaveURL(/\/login/);
}
