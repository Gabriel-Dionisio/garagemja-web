import type { Locator, Page } from '@playwright/test';
import { ShellPage } from './shell.page';

export class SpotSearchPage {
  readonly dialog: Locator;
  readonly empty: Locator;
  readonly back: Locator;
  readonly carousel: Locator;
  readonly next: Locator;
  private readonly toggle: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Filtros' });
    this.toggle = page.getByRole('button', { name: /^Filtros/ });
    this.empty = page.getByRole('heading', { name: 'Nenhuma vaga encontrada' });
    this.back = page.getByRole('link', { name: 'Voltar', exact: true });
    this.carousel = page.getByRole('group', { name: 'Foto da vaga' });
    this.next = this.carousel.getByRole('button', { name: 'Próxima imagem' });
  }

  async goto(): Promise<void> {
    await new ShellPage(this.page).open('Buscar vagas');
  }

  group(name: string): Locator {
    return this.dialog.getByRole('group', { name });
  }

  async openFilters(): Promise<void> {
    if (!(await this.dialog.isVisible())) await this.toggle.click();
  }

  async choose(group: string, option: string): Promise<void> {
    await this.openFilters();
    await this.group(group).getByRole('button', { name: option, exact: true }).click();
  }

  async search(term: string): Promise<void> {
    await this.openFilters();
    await this.dialog.getByLabel('Buscar por vaga, local ou condomínio').fill(term);
    await this.dialog.getByRole('button', { name: 'Filtrar', exact: true }).click();
  }

  async closeFilters(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Fechar' }).click();
  }

  card(number: string): Locator {
    return this.page.getByRole('link').filter({ hasText: `Vaga ${number}` });
  }
}
