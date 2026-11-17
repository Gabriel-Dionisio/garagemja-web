import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ParkingSpotsApi } from '../../../parking-spots/data/parking-spots-api';
import { ParkingSpot, SpotAvailability } from '../../../parking-spots/parking-spot.model';
import { VehiclesApi } from '../../../vehicles/data/vehicles-api';
import { VacancyDetailsPage } from './vacancy-details-page';

const spot: ParkingSpot = {
  id: 's1',
  condominiumId: 'c1',
  number: '12',
  status: 'ACTIVE',
  ownerResidentId: 'owner',
  owner: { residentId: 'owner', name: 'Ana Dona', unit: '12', block: null, photoUrl: null },
  condominiumName: 'Edifício A',
  availability: null,
  location: null,
  size: null,
  covered: false,
  statusReason: null,
  imageUrl: null,
  thumbnailUrl: null,
};

const availability: SpotAvailability = {
  id: 'a1',
  parkingSpotId: 's1',
  dailyPrice: 50,
  hourlyPrice: null,
  hourlyFrom: 0,
  hourlyTo: 24,
  startDate: '2999-01-01',
  endDate: '2999-12-31',
  active: true,
};

describe('VacancyDetailsPage', () => {
  const open = vi.fn();

  async function setup(residencyId: string, get = vi.fn().mockReturnValue(of(spot))) {
    open.mockReset().mockReturnValue({ closed: of(true) });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'search-vacancies/:spotId', component: VacancyDetailsPage },
          { path: 'rentals', children: [] },
        ]),
        {
          provide: ParkingSpotsApi,
          useValue: {
            get,
            images: () => of([]),
            availabilities: () => of([availability, { ...availability, id: 'a2', active: false }]),
            rules: () =>
              of({ maxPricePerDay: null, maxPricePerHour: null, hourlyRentalsEnabled: false }),
          },
        },
        { provide: VehiclesApi, useValue: { residencies: () => of([{ id: residencyId }]) } },
        { provide: Dialog, useValue: { open } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/search-vacancies/s1');
    await harness.fixture.whenStable();
    return { root: harness.routeNativeElement as HTMLElement, harness };
  }

  it('shows the owner and a request button, listing only active availabilities', async () => {
    const { root } = await setup('someone');
    expect(root.textContent).toContain('Ana Dona');
    expect(root.querySelectorAll('.actions button')).toHaveLength(1);
    expect(root.querySelector('.actions a')).toBeNull();
  });

  it('opens the request dialog and goes to my rentals when it succeeds', async () => {
    const { root, harness } = await setup('someone');
    root.querySelector<HTMLButtonElement>('.actions button')!.click();
    await harness.fixture.whenStable();
    expect(open).toHaveBeenCalled();
  });

  it('offers editing instead of requesting to the owner', async () => {
    const { root } = await setup('owner');
    expect(root.querySelector('.actions button')).toBeNull();
    expect(root.querySelector('.actions a')?.getAttribute('href')).toBe('/parking-spots/s1');
  });

  it('shows an alert when the spot is not found', async () => {
    const { root } = await setup(
      'someone',
      vi.fn().mockReturnValue(throwError(() => new Error('404'))),
    );
    expect(root.querySelector('app-alert')).not.toBeNull();
  });
});
