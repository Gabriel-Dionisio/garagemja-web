import type { Locator, Page } from '@playwright/test';
import { ConfirmDialog } from './confirm-dialog';
import { FilteredList } from './list';
import { ShellPage } from './shell.page';

export class VehiclesPage extends FilteredList {
  readonly confirmDialog: ConfirmDialog;
  readonly back: Locator;
  readonly cancel: Locator;
  readonly save: Locator;
  readonly color: Locator;
  readonly plate: Locator;
  readonly photos: Locator;

  constructor(page: Page) {
    super(page, 'Lista de veículos');
    this.confirmDialog = new ConfirmDialog(page);
    this.back = page.locator('form').getByRole('link', { name: 'Voltar', exact: true });
    this.cancel = page.locator('form').getByRole('link', { name: 'Cancelar', exact: true });
    this.save = page.getByRole('button', { name: 'Salvar', exact: true });
    this.color = page.getByLabel('Cor');
    this.plate = page.getByLabel('Placa');
    this.photos = page.getByAltText('Foto do veículo');
  }

  async goto(): Promise<void> {
    await new ShellPage(this.page).open('Meus veículos');
  }

  vehicle(text: string): Locator {
    return this.items.filter({ hasText: text });
  }

  edit(title: string): Locator {
    return this.page.getByRole('link', { name: `Editar: ${title}` });
  }

  remove(title: string): Locator {
    return this.page.getByRole('button', { name: `Excluir: ${title}` });
  }
}
