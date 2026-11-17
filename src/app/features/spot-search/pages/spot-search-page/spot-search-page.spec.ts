import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { SpotSearchPage } from './spot-search-page';

describe('SpotSearchPage', () => {
  const pin = {
    condominiumId: '0198a7c2-1b2c-7d3e-8f40-123456789abc',
    name: 'Solar',
    latitude: -23.5,
    longitude: -46.6,
    available: 3,
  };

  async function setup(
    url: string,
    search = vi.fn().mockReturnValue(of(toPage([], 0, 12, 0))),
    pins: Observable<(typeof pin)[]> = of([pin]),
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'search', component: SpotSearchPage }]),
        { provide: ParkingSpotsApi, useValue: { search, mapPins: () => pins } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return { search, root: harness.routeNativeElement as HTMLElement };
  }

  it('searches with the criteria and page from the URL', async () => {
    const { search } = await setup('/search?q=A12&sort=PRICE_ASC');
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'A12', sort: 'PRICE_ASC' }),
      0,
      12,
    );
  });

  it('starts with the default criteria and no filter counted', async () => {
    const { search, root } = await setup('/search');
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', sort: 'NUMBER', hourly: false }),
      0,
      12,
    );
    expect(root.querySelector('app-filter-panel')).not.toBeNull();
  });

  it('filters by the condominium of the clicked pin and clears on second click', async () => {
    const { search, root } = await setup('/search');
    const marker = () => root.querySelector<HTMLElement>('.map-pin');
    expect(marker()?.textContent).toBe('3');
    marker()?.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ condominiumId: pin.condominiumId }),
      0,
      12,
    );
    root.querySelector<HTMLElement>('.map-pin')?.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ condominiumId: null }),
      0,
      12,
    );
  });

  it('lets the user clear the condominium filter even when the map is hidden', async () => {
    const { search, root } = await setup(
      `/search?condominium=${pin.condominiumId}`,
      undefined,
      of([]),
    );
    expect(root.querySelector('app-map')).toBeNull();
    const chip = root.querySelector<HTMLButtonElement>(
      'app-chip-toggle button[aria-pressed="true"]',
    );
    chip?.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ condominiumId: null }),
      0,
      12,
    );
  });

  it('hides the map when the pins fail to load', async () => {
    const { root } = await setup(
      '/search',
      undefined,
      throwError(() => new Error('boom')),
    );
    expect(root.querySelector('app-map')).toBeNull();
    expect(root.querySelector('app-alert')).toBeNull();
  });

  it('hides the map when no condominium has coordinates', async () => {
    const { root } = await setup('/search', undefined, of([]));
    expect(root.querySelector('app-map')).toBeNull();
  });

  it('shows an error alert when the search fails', async () => {
    const { root } = await setup(
      '/search',
      vi.fn().mockReturnValue(throwError(() => new Error('boom'))),
    );
    expect(root.querySelector('app-alert')).not.toBeNull();
  });
});
