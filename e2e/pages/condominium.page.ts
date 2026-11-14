import type { Locator, Page } from '@playwright/test';
import { ShellPage } from './shell.page';
import { visit } from './visit';

export class CondominiumsPage {
  readonly heading: Locator;
  readonly joinWithCode: Locator;
  readonly createLink: Locator;
  readonly welcome: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Condomínios' }).first();
    this.joinWithCode = page.getByText('Entrar com código');
    this.createLink = page.locator('a[href="/condominiums/new"]');
    this.welcome = page.getByRole('heading', { name: /Bem-vindo/ });
  }

  goto() {
    return visit(this.page, '/condominiums');
  }

  async open(name: string): Promise<void> {
    await new ShellPage(this.page).open('Condomínios');
    const filters = this.page.getByRole('button', { name: /^Filtros/ });
    if ((await filters.getAttribute('aria-expanded')) !== 'true') await filters.click();
    await this.page.getByLabel('Nome do condomínio').fill(name);
    await this.page.getByRole('button', { name: 'Filtrar', exact: true }).click();
    await this.page
      .getByRole('link', { name: new RegExp(name, 'i') })
      .first()
      .click();
  }
}

export class CondominiumDetailPage {
  readonly tabs: Locator;
  readonly counts: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.tabs = page.getByRole('navigation', { name: 'Seções do condomínio' });
    this.counts = page.locator('dl').filter({ has: page.getByRole('term') });
  }

  goto(id: string, tab = '') {
    return visit(this.page, `/condominiums/${id}${tab ? `/${tab}` : ''}`);
  }

  tab(name: string): Locator {
    return this.tabs.getByRole('link', { name });
  }

  async openTab(name: string): Promise<void> {
    await this.tab(name).click();
  }

  count(label: string): Locator {
    return this.counts.locator('div').filter({ hasText: label }).getByRole('definition');
  }
}
