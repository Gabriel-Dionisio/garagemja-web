import type { Locator, Page } from '@playwright/test';
import { CondominiumDetailPage, CondominiumsPage } from './condominium.page';
import { ConfirmDialog } from './confirm-dialog';
import { FilteredList } from './list';
import { ShellPage } from './shell.page';

const toBr = (iso: string) => iso.split('-').reverse().join('/');

class SpotList extends FilteredList {
  readonly confirmDialog: ConfirmDialog;

  constructor(page: Page, listName: string) {
    super(page, listName);
    this.confirmDialog = new ConfirmDialog(page);
  }

  filterStatus(option: string) {
    return this.choose('Filtrar por situação', option);
  }

  filterSize(option: string) {
    return this.choose('Filtrar por tamanho', option);
  }

  async search(term: string): Promise<void> {
    await this.openFilters();
    await this.page.getByLabel('Buscar por número, local, condomínio ou dono').fill(term);
    await this.page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  }

  spot(number: string): Locator {
    return this.items.filter({
      has: this.page.getByText(new RegExp(`^Vaga ${number}( - Bloco .+)?$`)),
    });
  }
}

export class MyParkingSpotsPage extends SpotList {
  constructor(page: Page) {
    super(page, 'Minhas vagas');
  }

  async goto(): Promise<void> {
    await new ShellPage(this.page).open('Minhas vagas');
  }

  async startNewSpot(): Promise<void> {
    const link = this.page.getByRole('link', { name: 'Cadastrar vaga' });
    const fab = this.page.getByRole('button', { name: 'Cadastrar vaga' });
    await link.or(fab).first().waitFor();
    if ((await fab.count()) > 0) await fab.click();
    await link.filter({ visible: true }).first().click();
  }

  open(number: string) {
    return this.spot(number).getByRole('link').click();
  }
}

export class CondominiumSpotsPage extends SpotList {
  constructor(page: Page) {
    super(page, 'Vagas');
  }

  async goto(condominiumName: string): Promise<void> {
    await new CondominiumsPage(this.page).open(condominiumName);
    await new CondominiumDetailPage(this.page).openTab('Vagas');
  }

  async approve(number: string): Promise<void> {
    await this.page.getByRole('button', { name: `Aprovar: ${number}` }).click();
    await this.confirmDialog.confirm('Aprovar');
  }

  async reject(number: string, reason: string): Promise<void> {
    await this.page.getByRole('button', { name: `Rejeitar: ${number}` }).click();
    await this.confirmDialog.confirm('Rejeitar', reason);
  }

  async block(number: string, reason: string): Promise<void> {
    await this.page.getByRole('button', { name: `Bloquear: ${number}` }).click();
    await this.confirmDialog.confirm('Bloquear', reason);
  }
}

export class ParkingSpotFormPage {
  readonly heading: Locator;
  readonly number: Locator;
  readonly location: Locator;
  readonly requestNote: Locator;
  readonly sendRequest: Locator;
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1 });
    this.number = page.getByLabel('Número da vaga');
    this.location = page.getByLabel('Localização');
    this.requestNote = page.getByText('O pedido é enviado ao síndico');
    this.sendRequest = page.getByRole('button', { name: 'Enviar pedido' });
  }

  async openManaged(condominiumName: string, number: string): Promise<void> {
    const spots = new CondominiumSpotsPage(this.page);
    await spots.goto(condominiumName);
    await spots.search(number);
    await this.page.getByRole('link', { name: `Editar: ${number}` }).click();
  }

  async fill(number: string, location: string, size: string): Promise<void> {
    await this.number.fill(number);
    await this.location.fill(location);
    await this.page
      .getByRole('group', { name: 'Tamanho' })
      .getByRole('button', { name: size, exact: true })
      .click();
  }
}

export interface PeriodInput {
  start: string;
  end: string;
  daily?: string;
  hourly?: string;
  from?: string;
  to?: string;
}

export class SpotAvailabilityPanel {
  readonly addButton: Locator;
  readonly ownerOnly: Locator;
  readonly periods: Locator;
  readonly emptyText: Locator;
  readonly dialog: Locator;
  readonly priceMissing: Locator;
  readonly confirmDialog: ConfirmDialog;

  constructor(page: Page) {
    this.addButton = page.getByRole('button', { name: 'Novo período' });
    this.ownerOnly = page.getByText('Só o dono gerencia a disponibilidade desta vaga.');
    this.periods = page.getByRole('list', { name: 'Disponibilidade' }).getByRole('listitem');
    this.emptyText = page.getByText('Nenhum período cadastrado.');
    this.dialog = page.getByRole('dialog', { name: /período/ });
    this.priceMissing = this.dialog.getByText('Informe o preço por dia, por hora ou os dois.');
    this.confirmDialog = new ConfirmDialog(page);
  }

  period(startIso: string): Locator {
    return this.periods.filter({ hasText: toBr(startIso) });
  }

  activeSwitch(startIso: string): Locator {
    return this.period(startIso).getByRole('switch', { name: 'Período ativo' });
  }

  async fillDialog(input: Partial<PeriodInput>): Promise<void> {
    const dialog = this.dialog;
    if (input.start) await dialog.getByLabel('Início', { exact: true }).fill(toBr(input.start));
    if (input.end) await dialog.getByLabel('Fim', { exact: true }).fill(toBr(input.end));
    if (input.daily !== undefined) await dialog.getByLabel('Preço por dia').fill(input.daily);
    if (input.hourly !== undefined) await dialog.getByLabel('Preço por hora').fill(input.hourly);
    if (input.from) await dialog.getByLabel('A partir das').selectOption(input.from);
    if (input.to) await dialog.getByLabel('Até as').selectOption(input.to);
  }

  async add(input: PeriodInput): Promise<void> {
    await this.addButton.click();
    await this.fillDialog(input);
    await this.dialog.getByRole('button', { name: 'Adicionar período' }).click();
  }

  async edit(startIso: string, input: Partial<PeriodInput>): Promise<void> {
    await this.period(startIso)
      .getByRole('button', { name: `Editar: ${toBr(startIso)}` })
      .click();
    await this.fillDialog(input);
    await this.dialog.getByRole('button', { name: 'Salvar' }).click();
  }

  async remove(startIso: string): Promise<void> {
    await this.period(startIso)
      .getByRole('button', { name: `Remover período: ${toBr(startIso)}` })
      .click();
    await this.confirmDialog.confirm('Remover');
  }
}
