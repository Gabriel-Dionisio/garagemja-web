import type { Locator, Page, Response } from '@playwright/test';
import { PASSWORD, randomCpf } from '../support/real-api';
import { visit } from './visit';

const apiResponse = (page: Page, path: string) =>
  page.waitForResponse((response) => response.url().endsWith(`/api/v1/auth/${path}`));

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly goToRegister: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByRole('textbox', { name: 'E-mail' });
    this.password = page.getByLabel('Senha', { exact: true });
    this.submit = page.getByRole('button', { name: 'Entrar' });
    this.goToRegister = page.getByRole('link', { name: 'Criar conta' });
  }

  goto() {
    return visit(this.page, '/login');
  }

  async login(email: string, password = PASSWORD): Promise<Response> {
    await this.goto();
    await this.email.fill(email);
    await this.password.fill(password);
    const response = apiResponse(this.page, 'login');
    await this.submit.click();
    return response;
  }
}

export class RegisterPage {
  readonly goToLogin: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.goToLogin = page.getByRole('link', { name: 'Ir para o login' });
  }

  async register(email: string): Promise<Response> {
    const page = this.page;
    await page.goto('/register');
    await page.getByLabel('Nome completo').fill('Teste Playwright Silva');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Telefone').fill('11987654321');
    await page.getByLabel('CPF').fill(randomCpf());
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirmar senha').fill(PASSWORD);
    const response = apiResponse(page, 'register');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    return response;
  }

  async confirmEmail(code: string): Promise<Response> {
    const response = apiResponse(this.page, 'verify-email');
    await visit(this.page, `/confirm-email?oobCode=${encodeURIComponent(code)}`);
    return response;
  }
}
