import type { Locator, Page } from '@playwright/test';
import { ConfirmDialog } from './confirm-dialog';
import { FilteredList } from './list';
import { RentalDetailsDialog, openItem } from './rental-details';
import { ShellPage } from './shell.page';

export class MyRentalsPage extends FilteredList {
  readonly confirmDialog: ConfirmDialog;
  readonly paymentDialog: Locator;
  readonly details: RentalDetailsDialog;

  constructor(page: Page) {
    super(page, 'Meus aluguéis');
    this.confirmDialog = new ConfirmDialog(page);
    this.details = new RentalDetailsDialog(page);
    this.paymentDialog = page.getByRole('dialog', { name: 'Pagamento' });
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

  openDetails(number: string) {
    return openItem(this.rental(number));
  }

  async cancel(number: string): Promise<void> {
    await this.rental(number)
      .getByRole('button', { name: `Cancelar pedido da vaga ${number}` })
      .click();
    await this.confirmDialog.confirm('Cancelar pedido');
  }

  async payWithPix(number: string): Promise<void> {
    await this.rental(number).getByRole('button', { name: 'Pagar' }).click();
    const dialog = this.paymentDialog;
    await dialog.getByRole('button', { name: 'Pagar' }).click();
    await dialog.getByLabel('Código PIX copia e cola').waitFor();
  }
}
