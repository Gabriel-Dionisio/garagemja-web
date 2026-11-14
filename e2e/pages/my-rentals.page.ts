import type { Page } from '@playwright/test';
import { ConfirmDialog } from './confirm-dialog';
import { FilteredList } from './list';
import { ShellPage } from './shell.page';

export class MyRentalsPage extends FilteredList {
  readonly confirmDialog: ConfirmDialog;

  constructor(page: Page) {
    super(page, 'Meus aluguéis');
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(): Promise<void> {
    await new ShellPage(this.page).open('Meus aluguéis');
  }

  filterStatus(option: string) {
    return this.choose('Filtrar aluguéis por status', option);
  }

  rental(number: string) {
    return this.items.filter({ hasText: `Vaga ${number}` });
  }

  async cancel(number: string): Promise<void> {
    await this.rental(number)
      .getByRole('button', { name: `Cancelar pedido: ${number}` })
      .click();
    await this.confirmDialog.confirm('Cancelar pedido');
  }
}
