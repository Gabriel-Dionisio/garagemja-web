import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Page } from '../../../../shared/models/page';
import { RentalsApi } from '../../data/rentals-api';
import { Rental } from '../../rental.model';
import { MyRentalsPage } from './my-rentals-page';

const empty: Page<Rental> = { items: [], page: 0, size: 25, total: 0, hasNext: false };

describe('MyRentalsPage', () => {
  async function setup(url = '/rentals') {
    const list = vi.fn().mockReturnValue(of(empty));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'rentals', component: MyRentalsPage }]),
        { provide: RentalsApi, useValue: { list } },
      ],
    });
    const { RouterTestingHarness } = await import('@angular/router/testing');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return { list, root: harness.routeNativeElement as HTMLElement };
  }

  it('renders the filter panel with the list state', async () => {
    const { root } = await setup();
    expect(root.querySelector('app-filter-panel')).not.toBeNull();
    expect(root.querySelector('app-page-header')).not.toBeNull();
  });

  it('starts filtered when the status comes from the query string', async () => {
    const { list, root } = await setup('/rentals?status=ACTIVE');
    expect(list).toHaveBeenCalledWith(0, 25, 'ACTIVE');
    expect(root.querySelector('.count')?.textContent?.trim()).toBe('1');
  });

  it('ignores an unknown status in the query string', async () => {
    const { list } = await setup('/rentals?status=NOPE');
    expect(list).toHaveBeenCalledWith(0, 25, null);
  });
});
