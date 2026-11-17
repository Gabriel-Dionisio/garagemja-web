import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
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

describe('WalletPage', () => {
  const list = vi.fn();
  const entries = vi.fn();
  const open = vi.fn();

  async function setup(wallets = [wallet()], items = [entry()], closed = false) {
    list.mockReset().mockReturnValue(of(wallets));
    entries.mockReset().mockReturnValue(of(toPage(items, 0, 25, items.length)));
    open.mockReset().mockReturnValue({ closed: of(closed) });
    TestBed.configureTestingModule({
      providers: [
        { provide: WalletsApi, useValue: { list, entries } },
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
    expect(element.querySelector('app-chip-group')).toBeNull();
  });

  it('switches the statement when another wallet is chosen', async () => {
    const other = wallet({ type: 'CONDOMINIUM', refId: 'c1', name: 'Edifício A' });
    const { fixture, element } = await setup([wallet(), other]);
    const chips = element.querySelectorAll<HTMLButtonElement>('app-chip-group button');
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
    expect(element.querySelector<HTMLButtonElement>('app-page-header button')?.disabled).toBe(true);
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
        { provide: WalletsApi, useValue: { list, entries } },
        { provide: Dialog, useValue: { open } },
      ],
    });
    const fixture = TestBed.createComponent(WalletPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-alert')).not.toBeNull();
  });
});
