import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { toPage } from '../../../../shared/models/page';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { ParkingSpot } from '../../../../shared/spots/parking-spot.model';
import { OwnedRentalsApi } from '../../../../shared/rentals/owned-rentals-api';
import { RentalsApi } from '../../../../shared/rentals/rentals-api';
import { HomeApi } from '../../data/home-api';
import { HomePage } from './home-page';

describe('HomePage', () => {
  async function setup(residencies: number, manager: boolean) {
    const search = vi.fn().mockReturnValue(of(toPage([], 0, 6, 0)));
    const rentals = vi.fn().mockReturnValue(of(toPage([], 0, 3, 0)));
    const owned = vi.fn().mockReturnValue(of(toPage([], 0, 3, 0)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: HomeApi, useValue: { residencyCount: () => of(residencies) } },
        { provide: ParkingSpotsApi, useValue: { search } },
        { provide: RentalsApi, useValue: { list: rentals } },
        { provide: OwnedRentalsApi, useValue: { list: owned } },
        { provide: AuthService, useValue: { hasRole: () => manager } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    return { navigate, search, fixture, rentals, owned };
  }

  it('sends an account without any link to the welcome cards', async () => {
    const { navigate } = await setup(0, false);
    expect(navigate).toHaveBeenCalledWith(['/condominiums'], { replaceUrl: true });
  });

  it('skips the rental previews for an account without residency', async () => {
    const { rentals, owned } = await setup(0, true);
    expect(rentals).not.toHaveBeenCalled();
    expect(owned).not.toHaveBeenCalled();
  });

  it('loads the rental previews for a resident', async () => {
    const { rentals, owned } = await setup(1, false);
    expect(rentals).toHaveBeenCalledWith(0, expect.any(Number), 'APPROVED');
    expect(owned).toHaveBeenCalledWith(0, expect.any(Number), 'PENDING');
  });

  it('keeps a manager without residency on the home', async () => {
    expect((await setup(0, true)).navigate).not.toHaveBeenCalled();
  });

  it('lists a short preview of available spots for a resident', async () => {
    const { navigate, search } = await setup(2, false);
    expect(navigate).not.toHaveBeenCalled();
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ sort: 'NUMBER' }), 0, 6);
  });

  it('appends the next page of spots when the end of the list is reached', async () => {
    const { search, fixture } = await setup(2, false);
    const spot = (id: string) => ({ id }) as ParkingSpot;
    search.mockReturnValueOnce(of(toPage([spot('b')], 1, 6, 7)));
    fixture.componentInstance['result'].set(toPage([spot('a')], 0, 6, 7));
    fixture.componentInstance['loadMore']();
    expect(search).toHaveBeenLastCalledWith(expect.anything(), 1, 6);
    expect(fixture.componentInstance['result']()?.items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('does not ask for more spots on the last page', async () => {
    const { search, fixture } = await setup(2, false);
    search.mockClear();
    fixture.componentInstance['loadMore']();
    expect(search).not.toHaveBeenCalled();
  });

  it('sends the typed search and period to the vacancy search', async () => {
    const { navigate, fixture } = await setup(2, false);
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('app-text-field input');
    input!.value = ' sol ';
    input!.dispatchEvent(new Event('input'));
    element.querySelector<HTMLFormElement>('form.search-panel')!.dispatchEvent(new Event('submit'));
    expect(navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: expect.objectContaining({ q: 'sol', from: null }),
    });
  });
});
