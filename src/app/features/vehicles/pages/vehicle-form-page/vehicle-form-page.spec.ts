import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { VehiclesApi } from '../../data/vehicles-api';
import { Residency, Vehicle } from '../../vehicle.model';
import { VehicleFormPage } from './vehicle-form-page';

const aurora: Residency = {
  id: 'r1',
  condominiumName: 'Residencial Aurora',
  unit: '101',
  block: 'A',
  approved: true,
};
const pending: Residency = { ...aurora, id: 'r2', condominiumName: 'Pendente', approved: false };
const vehicle: Vehicle = {
  id: 'v1',
  residentId: 'r1',
  plate: 'ABC1234',
  brand: 'Honda',
  model: 'Civic',
  color: 'Prata',
};

describe('VehicleFormPage', () => {
  async function setup(url: string, residencies: Residency[] = [aurora]) {
    const api = {
      residencies: vi.fn().mockReturnValue(of(residencies)),
      get: vi.fn().mockReturnValue(of(vehicle)),
      create: vi.fn().mockReturnValue(of(vehicle)),
      update: vi.fn().mockReturnValue(of(vehicle)),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'vehicles', children: [] },
            { path: 'vehicles/new', component: VehicleFormPage },
            { path: 'vehicles/:id', component: VehicleFormPage },
          ],
          withComponentInputBinding(),
        ),
        { provide: VehiclesApi, useValue: api },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    const root = harness.routeNativeElement as HTMLElement;
    const type = (label: string, value: string) => {
      const input = Array.from(root.querySelectorAll('app-text-field'))
        .find((field) => field.textContent?.includes(label))
        ?.querySelector('input');
      if (!input) throw new Error(`field ${label} not found`);
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      root.querySelector('form')?.dispatchEvent(new Event('submit'));
      await harness.fixture.whenStable();
    };
    return { api, root, harness, type, submit };
  }

  it('creates a vehicle for the only approved residency and returns to the list', async () => {
    const { api, root, type, submit } = await setup('/vehicles/new');
    expect(root.querySelector('select')?.value).toBe('r1');
    type('Placa', 'abc-1234');
    type('Marca', 'Honda');
    await submit();

    expect(api.create).toHaveBeenCalledWith('r1', {
      plate: 'ABC1234',
      brand: 'Honda',
      model: '',
      color: '',
    });
    expect(TestBed.inject(Router).url).toBe('/vehicles');
  });

  it('blocks submit with an invalid plate', async () => {
    const { api, type, submit } = await setup('/vehicles/new');
    type('Placa', 'AB1');
    await submit();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('asks for the condominium when there is more than one approved residency', async () => {
    const { api, type, submit } = await setup('/vehicles/new', [
      aurora,
      { ...aurora, id: 'r3', condominiumName: 'Outro' },
    ]);
    type('Placa', 'ABC1234');
    await submit();
    expect(api.create).not.toHaveBeenCalled();
  });

  it('explains when there is no approved residency', async () => {
    const { root } = await setup('/vehicles/new', [pending]);
    expect(root.querySelector('form')).toBeNull();
    expect(root.querySelector('a[href="/condominiums"]')).not.toBeNull();
  });

  it('fills the form when editing and updates the vehicle', async () => {
    const { api, root, type, submit } = await setup('/vehicles/v1', [aurora, pending]);
    expect(api.get).toHaveBeenCalledWith('v1');
    const inputs = Array.from(root.querySelectorAll('input')).map((input) => input.value);
    expect(inputs).toEqual(['Honda', 'Civic', 'ABC1234', 'Prata']);
    expect(root.querySelector('select')?.disabled).toBe(true);

    type('Cor', 'Preto');
    await submit();
    expect(api.update).toHaveBeenCalledWith('v1', {
      plate: 'ABC1234',
      brand: 'Honda',
      model: 'Civic',
      color: 'Preto',
    });
    expect(TestBed.inject(Router).url).toBe('/vehicles');
  });
});
