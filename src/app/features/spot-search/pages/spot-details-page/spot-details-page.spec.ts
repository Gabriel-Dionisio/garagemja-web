import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { ParkingSpot, SpotAvailability } from '../../../../shared/spots/parking-spot.model';
import { VehiclesApi } from '../../../../shared/vehicles/vehicles-api';
import { SpotDetailsPage } from './spot-details-page';

const spot: ParkingSpot = {
  id: 's1',
  condominiumId: 'c1',
  number: '12',
  status: 'ACTIVE',
  ownerResidentId: 'owner',
  owner: {
    residentId: 'owner',
    userId: 'owner-user',
    name: 'Ana Dona',
    unit: '12',
    block: null,
    photoUrl: null,
  },
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

describe('SpotDetailsPage', () => {
  const open = vi.fn();

  async function setup(
    residencyId: string,
    get = vi.fn().mockReturnValue(of(spot)),
    url = '/search/s1',
    images = () => of([]),
  ) {
    open.mockReset().mockReturnValue({ closed: of(true) });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'search/:spotId', component: SpotDetailsPage },
          { path: 'rentals', children: [] },
        ]),
        {
          provide: ParkingSpotsApi,
          useValue: {
            get,
            images,
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
    await harness.navigateByUrl(url);
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

  it('goes back to /search when opened without an origin', async () => {
    const { root } = await setup('someone');
    expect(root.querySelector('a.back')?.getAttribute('href')).toBe('/search');
  });

  it('goes back to Home when opened from Home', async () => {
    const { root } = await setup('someone', undefined, '/search/s1?returnUrl=%2Fhome');
    expect(root.querySelector('a.back')?.getAttribute('href')).toBe('/home');
  });

  it('goes back to the search with the same filters', async () => {
    const returnUrl = encodeURIComponent('/search?q=a&size=SMALL');
    const { root } = await setup('someone', undefined, `/search/s1?returnUrl=${returnUrl}`);
    expect(root.querySelector('a.back')?.getAttribute('href')).toBe('/search?q=a&size=SMALL');
  });

  it('shows size and coverage chips and a carousel that navigates', async () => {
    const images = () =>
      of([
        { id: 'i1', url: '/a.jpg' },
        { id: 'i2', url: '/b.jpg' },
      ]) as never;
    const { root, harness } = await setup(
      'someone',
      vi.fn().mockReturnValue(of({ ...spot, size: 'SMALL' })),
      '/search/s1',
      images,
    );
    expect(root.querySelectorAll('app-spot-features app-badge')).toHaveLength(2);
    const carousel = root.querySelector('app-carousel')!;
    expect(carousel.querySelector('[role="group"]')?.getAttribute('aria-label')).toBeTruthy();
    const main = () => carousel.querySelector<HTMLImageElement>('.main')!.getAttribute('src');
    expect(main()).toBe('/a.jpg');
    carousel.querySelector<HTMLButtonElement>('.next')!.click();
    harness.fixture.detectChanges();
    expect(main()).toBe('/b.jpg');
  });
});
