import type { Page } from '@playwright/test';
import { ConfirmDialog } from './confirm-dialog';
import { FilteredList } from './list';
import { RentalDetailsDialog, openItem } from './rental-details';
import { ShellPage } from './shell.page';

export class RequestsPage extends FilteredList {
  readonly confirmDialog: ConfirmDialog;
  readonly details: RentalDetailsDialog;

  constructor(page: Page) {
    super(page, 'Pedidos recebidos', 'Filtros');
    this.confirmDialog = new ConfirmDialog(page);
    this.details = new RentalDetailsDialog(page);
  }

  async goto(): Promise<void> {
    await new ShellPage(this.page).open('Pedidos recebidos');
  }

  filterStatus(option: string) {
    return this.choose('Situação dos pedidos', option);
  }

  request(number: string) {
    return this.items.filter({ hasText: `Vaga ${number}` });
  }

  openDetails(number: string) {
    return openItem(this.request(number));
  }

  async approve(number: string): Promise<void> {
    await this.request(number).getByRole('button', { name: 'Aprovar', exact: true }).click();
    await this.confirmDialog.confirm('Aprovar');
  }

  async refuse(number: string, reason: string): Promise<void> {
    await this.request(number).getByRole('button', { name: 'Recusar', exact: true }).click();
    await this.confirmDialog.confirm('Recusar', reason);
  }
}
