import type { Page } from '@playwright/test';
import { ConfirmDialog } from './confirm-dialog';
import { FilteredList } from './list';
import { ShellPage } from './shell.page';

export class RequestsPage extends FilteredList {
  readonly confirmDialog: ConfirmDialog;

  constructor(page: Page) {
    super(page, 'Solicitações', 'Filtrar solicitações');
    this.confirmDialog = new ConfirmDialog(page);
  }

  async goto(): Promise<void> {
    await new ShellPage(this.page).open('Solicitações');
  }

  filterStatus(option: string) {
    return this.choose('Situação das solicitações', option);
  }

  request(number: string) {
    return this.items.filter({ hasText: `Vaga ${number}` });
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
