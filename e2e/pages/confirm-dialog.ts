import type { Locator, Page } from '@playwright/test';

export class ConfirmDialog {
  readonly root: Locator;
  readonly reason: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('alertdialog');
    this.reason = this.root.getByLabel('Motivo');
    this.cancelButton = this.root.getByRole('button', { name: 'Cancelar', exact: true });
  }

  async confirm(label: string, reason?: string): Promise<void> {
    if (reason) await this.reason.fill(reason);
    await this.root.getByRole('button', { name: label, exact: true }).click();
  }
}
