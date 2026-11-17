import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { SpotAvailability } from '../../../../shared/spots/parking-spot.model';
import { RentalsApi } from '../../../../shared/rentals/rentals-api';
import { VehiclesApi } from '../../../../shared/vehicles/vehicles-api';
import { VehicleListItem } from '../../../../shared/vehicles/vehicle.model';
import { RequestRentalDialog, RequestRentalDialogData } from './request-rental-dialog';

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

const vehicle = (id: string, condominiumId: string): VehicleListItem => ({
  id,
  residentId: `res-${id}`,
  plate: 'ABC1234',
  brand: 'Honda',
  model: 'Civic',
  color: null,
  residency: {
    id: `res-${id}`,
    condominiumId,
    condominiumName: 'X',
    unit: null,
    block: null,
    approved: true,
  },
});

describe('RequestRentalDialog', () => {
  const create = vi.fn();
  const close = vi.fn();

  function setup(vehicles: VehicleListItem[]) {
    create.mockReset().mockReturnValue(of({}));
    close.mockReset();
    const data = {
      spot: { id: 's1', condominiumId: 'c1' },
      availabilities: [availability],
      rules: { maxPricePerDay: null, maxPricePerHour: null, hourlyRentalsEnabled: false },
      from: '2999-02-01',
      to: '2999-02-03',
    } as RequestRentalDialogData;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: { close } },
        { provide: RentalsApi, useValue: { create } },
        {
          provide: VehiclesApi,
          useValue: { list: () => of(toPage(vehicles, 0, 100, vehicles.length)) },
        },
      ],
    });
    const fixture = TestBed.createComponent(RequestRentalDialog);
    return fixture;
  }

  it('keeps only vehicles of the spot condominium and preselects the single one', async () => {
    const fixture = setup([vehicle('v1', 'c1'), vehicle('v2', 'other')]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('150');
    root.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        parkingSpotId: 's1',
        vehicleId: 'v1',
        renterResidentId: 'res-v1',
        startDate: '2999-02-01',
        endDate: '2999-02-03',
        startHour: null,
        endHour: null,
      }),
    );
    expect(close).toHaveBeenCalledWith(true);
  });

  it('does not submit without a vehicle', async () => {
    const fixture = setup([]);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(create).not.toHaveBeenCalled();
  });

  it('shows the server error and stays open when creation fails', async () => {
    const fixture = setup([vehicle('v1', 'c1')]);
    create.mockReturnValue(throwError(() => new Error('boom')));
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(close).not.toHaveBeenCalled();
    expect(root.querySelector('app-alert')).not.toBeNull();
  });
});
