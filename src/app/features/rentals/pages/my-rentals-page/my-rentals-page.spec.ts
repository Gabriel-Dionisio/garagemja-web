import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Page } from '../../../../shared/models/page';
import { RentalsApi } from '../../../../shared/rentals/rentals-api';
import { ReviewsApi } from '../../../../shared/reviews/reviews-api';
import { Rental } from '../../../../shared/rentals/rental.model';
import { MyRentalsPage } from './my-rentals-page';

const empty: Page<Rental> = { items: [], page: 0, size: 25, total: 0, hasNext: false };

describe('MyRentalsPage', () => {
  const item = (overrides: Partial<Rental> = {}): Rental => ({
    id: 'r1',
    condominiumName: 'Edifício A',
    parkingSpotId: 's1',
    parkingSpotNumber: '12',
    startDate: '2026-11-20',
    endDate: '2026-11-21',
    startHour: null,
    endHour: null,
    price: 80,
    total: 240,
    payable: 264,
    status: 'APPROVED',
    cancelReason: null,
    paid: false,
    paymentPending: false,
    ...overrides,
  });

  async function setup(url = '/rentals', items: Rental[] = [], pending: string[] = []) {
    const list = vi.fn().mockReturnValue(of({ ...empty, items, total: items.length }));
    const pendingReviews = vi.fn().mockReturnValue(of(new Set(pending)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'rentals', component: MyRentalsPage }]),
        { provide: RentalsApi, useValue: { list } },
        { provide: ReviewsApi, useValue: { pendingReviews } },
      ],
    });
    const { RouterTestingHarness } = await import('@angular/router/testing');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return { list, pendingReviews, root: harness.routeNativeElement as HTMLElement };
  }

  it('renders the filter panel with the list state', async () => {
    const { root } = await setup();
    expect(root.querySelector('app-filter-panel')).not.toBeNull();
    expect(root.querySelector('app-page-header')).not.toBeNull();
  });

  it('starts filtered when the status comes from the query string', async () => {
    const { list, root } = await setup('/rentals?status=ACTIVE');
    expect(list).toHaveBeenCalledWith(0, 25, 'ACTIVE', '');
    expect(root.querySelector('.count')?.textContent?.trim()).toBe('1');
  });

  it('sends the search term and goes back to the first page', async () => {
    const { list, root } = await setup();
    const input = root.querySelector<HTMLInputElement>('app-search-filter input');
    input!.value = 'ABC';
    input!.dispatchEvent(new Event('input'));
    root
      .querySelector<HTMLFormElement>('app-search-filter form')!
      .dispatchEvent(new Event('submit'));
    await vi.waitFor(() => expect(list).toHaveBeenLastCalledWith(0, 25, null, 'ABC'));
  });

  it('ignores an unknown status in the query string', async () => {
    const { list } = await setup('/rentals?status=NOPE');
    expect(list).toHaveBeenCalledWith(0, 25, null, '');
  });

  it('offers payment only for approved unpaid rentals and shows the payable amount', async () => {
    const { root } = await setup('/rentals', [item(), item({ id: 'r2', paid: true })]);
    const rows = root.querySelectorAll('li');
    expect(rows[0].textContent).toContain('264,00');
    expect(rows[0].textContent).toContain('Pagar');
    expect(rows[1].textContent).not.toContain('Pagar');
  });

  it('offers the review only for finished rentals the API still accepts', async () => {
    const finished = [
      item({ id: 'f1', status: 'FINISHED' }),
      item({ id: 'f2', status: 'FINISHED' }),
    ];
    const { pendingReviews, root } = await setup('/rentals', [...finished, item()], ['f1']);
    expect(pendingReviews).toHaveBeenCalledWith(['f1', 'f2']);
    const rows = root.querySelectorAll('li');
    const rate = (row: Element) => row.querySelector('button[aria-label="Avaliar"]');
    expect(rate(rows[0])).not.toBeNull();
    expect(rate(rows[1])).toBeNull();
    expect(rate(rows[2])).toBeNull();
  });

  it('gives the cancel icon an accessible name', async () => {
    const { root } = await setup('/rentals', [item()]);
    const icon = root.querySelector('button[appIconButton]');
    expect(icon?.getAttribute('aria-label')).toBe('Cancelar pedido da vaga 12');
  });

  it('opens the details dialog on click with spot link, values and reason', async () => {
    const { root } = await setup('/rentals', [
      item({ status: 'CANCELED', cancelReason: 'unpaid', paid: false }),
    ]);
    root.querySelector<HTMLButtonElement>('li button.main')!.click();
    await vi.waitFor(() =>
      expect(document.querySelector('app-rental-details-dialog')?.textContent).toContain(
        'Edifício A',
      ),
    );
    const dialog = document.querySelector('app-rental-details-dialog')!;
    expect(dialog.textContent).toContain('Edifício A');
    expect(dialog.textContent).toContain('264,00');
    expect(dialog.textContent).toContain('não pago');
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('/search/s1');
  });
});
