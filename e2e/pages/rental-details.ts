import type { Locator, Page } from '@playwright/test';

export class RentalDetailsDialog {
  readonly dialog: Locator;
  readonly close: Locator;
  readonly spotLink: Locator;
  readonly profileLink: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Detalhes do aluguel' });
    this.close = this.dialog.getByRole('button', { name: 'Fechar' });
    this.spotLink = this.dialog.getByRole('link', { name: 'Ver vaga' });
    this.profileLink = this.dialog.getByRole('link', { name: 'Ver perfil' });
  }
}

export const openItem = (item: Locator) => item.locator('button.main').click();
