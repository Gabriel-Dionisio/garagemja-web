import { Dialog } from '@angular/cdk/dialog';
import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { Chart } from '../../../../shared/ui/chart/chart';
import { PeriodChart } from '../../../../shared/ui/chart/period-chart';
import { WalletsApi } from '../../data/wallets-api';
import { WalletEntry, WalletSummary } from '../../wallet.model';
import { WalletPage } from './wallet-page';

const wallet = (overrides: Partial<WalletSummary> = {}): WalletSummary => ({
  type: 'OWNER',
  refId: 'u1',
  name: 'Maria',
  available: 40,
  pending: 7.5,
  ...overrides,
});

const entry = (overrides: Partial<WalletEntry> = {}): WalletEntry => ({
  id: 'e1',
  kind: 'RENTAL_CREDIT',
  amount: 47.5,
  availableAt: '2026-11-16T10:00:00Z',
  released: true,
  rentalId: 'r1',
  createdAt: '2026-11-15T10:00:00Z',
  ...overrides,
});

@Component({ selector: 'app-chart', template: '' })
class ChartStub {
  readonly kind = input<string>();
  readonly labels = input<readonly string[]>();
  readonly series = input<{ label: string; data: number[] }[]>();
  readonly description = input<string>();
  readonly xLabel = input<string>();
  readonly yLabel = input<string>();
  readonly format = input<(value: number) => string>();
  readonly showValues = input<boolean>();
}

describe('WalletPage', () => {
  const list = vi.fn();
  const entries = vi.fn();
  const flow = vi.fn();
  const open = vi.fn();

  beforeEach(() => {
    flow.mockReset().mockReturnValue(of([{ start: '2026-11', credits: 70, debits: 30 }]));
    TestBed.overrideComponent(PeriodChart, {
      remove: { imports: [Chart] },
      add: { imports: [ChartStub] },
    });
  });

  const walletChoosers = (element: HTMLElement) =>
    Array.from(element.querySelectorAll('app-chip-group')).filter(
      (group) => !group.closest('app-period-chart'),
    );

  async function setup(wallets = [wallet()], items = [entry()], closed = false) {
    list.mockReset().mockReturnValue(of(wallets));
    entries.mockReset().mockReturnValue(of(toPage(items, 0, 25, items.length)));
    open.mockReset().mockReturnValue({ closed: of(closed) });
    TestBed.configureTestingModule({
      providers: [
        { provide: WalletsApi, useValue: { list, entries, flow } },
        { provide: Dialog, useValue: { open } },
      ],
    });
    const fixture = TestBed.createComponent(WalletPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows balances and the statement of the first wallet', async () => {
    const { element } = await setup();
    expect(entries).toHaveBeenCalledWith(wallet(), 0, expect.any(Number));
    expect(element.textContent).toContain('40,00');
    expect(element.textContent).toContain('7,50');
    expect(element.querySelectorAll('li')).toHaveLength(1);
    expect(walletChoosers(element)).toHaveLength(0);
  });

  it('charts money in and out of the selected wallet by month', async () => {
    const { fixture } = await setup();
    expect(flow).toHaveBeenCalledWith(wallet(), 'MONTH');
    const chart = fixture.debugElement.query((node) => node.componentInstance instanceof ChartStub)
      .componentInstance as ChartStub;
    expect(chart.series()?.map((series) => series.label)).toEqual(['Entradas', 'Saídas']);
    expect(chart.series()?.[0].data).toEqual([70]);
    expect(chart.labels()).toEqual(['nov.']);
    expect(chart.format()?.(70)).toContain('70,00');
    expect(chart.showValues()).toBe(false);
  });

  it('reloads the chart when another period is chosen', async () => {
    const { fixture, element } = await setup();
    const periods = element.querySelectorAll<HTMLButtonElement>('app-period-chart button');
    periods[2].click();
    await fixture.whenStable();
    expect(flow).toHaveBeenLastCalledWith(wallet(), 'YEAR');
  });

  it('shows the chart error without hiding the statement', async () => {
    flow.mockReturnValue(throwError(() => new Error('falha')));
    const { element } = await setup();
    expect(element.querySelector('app-period-chart app-alert')).not.toBeNull();
    expect(element.querySelectorAll('li')).toHaveLength(1);
  });

  it('switches the statement when another wallet is chosen', async () => {
    const other = wallet({ type: 'CONDOMINIUM', refId: 'c1', name: 'Edifício A' });
    const { fixture, element } = await setup([wallet(), other]);
    const chips = walletChoosers(element)[0].querySelectorAll<HTMLButtonElement>('button');
    chips[1].click();
    await fixture.whenStable();
    expect(entries).toHaveBeenLastCalledWith(other, 0, expect.any(Number));
  });

  it('opens the withdraw dialog and reloads after it succeeds', async () => {
    const { fixture, element } = await setup([wallet()], [entry()], true);
    const button = element.querySelector<HTMLButtonElement>('app-page-header button');
    button?.click();
    await fixture.whenStable();
    expect(open).toHaveBeenCalled();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('disables withdrawal without available balance', async () => {
    const { element } = await setup([wallet({ available: 0 })]);
    const button = element.querySelector<HTMLButtonElement>('app-page-header button');
    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute('aria-describedby')).toBe('withdraw-blocked');
    expect(element.querySelector('#withdraw-blocked')?.textContent).toContain(
      'Sem saldo disponível para saque.',
    );
  });

  it('explains that a negative balance blocks withdrawal', async () => {
    const { element } = await setup([wallet({ available: -10 })]);
    expect(element.querySelector('#withdraw-blocked')?.textContent).toContain(
      'saldo ficou negativo',
    );
  });

  it('allows withdrawal without the blocked notice when there is balance', async () => {
    const { element } = await setup();
    expect(element.querySelector('#withdraw-blocked')).toBeNull();
  });

  it('leaves loading when the user has no wallet', async () => {
    const { element } = await setup([]);
    expect(entries).not.toHaveBeenCalled();
    expect(element.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('shows the error when wallets fail to load', async () => {
    list.mockReset().mockReturnValue(throwError(() => new Error('falha')));
    TestBed.configureTestingModule({
      providers: [
        { provide: WalletsApi, useValue: { list, entries, flow } },
        { provide: Dialog, useValue: { open } },
      ],
    });
    const fixture = TestBed.createComponent(WalletPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-alert')).not.toBeNull();
  });
});
