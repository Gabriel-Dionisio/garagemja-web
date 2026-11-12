import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { VehiclesApi } from '../../data/vehicles-api';
import { VehicleListItem } from '../../vehicle.model';
import { VehiclesPage } from './vehicles-page';

const item: VehicleListItem = {
  id: 'v1',
  residentId: 'r1',
  plate: 'ABC1234',
  brand: 'Honda',
  model: 'Civic',
  color: 'Prata',
  residency: {
    id: 'r1',
    condominiumName: 'Residencial Aurora',
    unit: '101',
    block: 'A',
    approved: true,
  },
};

describe('VehiclesPage', () => {
  async function setup(result: Observable<VehicleListItem[]>) {
    const listMine = vi.fn().mockReturnValue(result);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'vehicles', component: VehiclesPage }]),
        { provide: VehiclesApi, useValue: { listMine } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/vehicles');
    await harness.fixture.whenStable();
    return { listMine, root: harness.routeNativeElement as HTMLElement };
  }

  it('renders each vehicle with plate, condominium and an edit link', async () => {
    const { root } = await setup(of([item]));
    const text = root.textContent ?? '';
    expect(text).toContain('Honda Civic');
    expect(text).toContain('ABC-1234');
    expect(text).toContain('Residencial Aurora · A / 101');
    expect(root.querySelector<HTMLAnchorElement>('a[href="/vehicles/v1"]')).not.toBeNull();
  });

  it('links the header action to the registration form', async () => {
    const { root } = await setup(of([item]));
    expect(root.querySelector('a[href="/vehicles/new"]')).not.toBeNull();
  });

  it('shows the empty state when there are no vehicles', async () => {
    const { root } = await setup(of([]));
    expect(root.querySelector('app-empty-state')).not.toBeNull();
    expect(root.querySelector('li')).toBeNull();
  });

  it('shows an error with a retry action and reloads on retry', async () => {
    const { root, listMine } = await setup(throwError(() => new Error('boom')));
    expect(root.querySelector('app-alert')).not.toBeNull();
    listMine.mockReturnValue(of([item]));
    root.querySelector<HTMLButtonElement>('app-alert button')?.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(listMine).toHaveBeenCalledTimes(2);
    expect(root.querySelector('app-alert')).toBeNull();
    expect(root.textContent).toContain('Honda Civic');
  });
});
