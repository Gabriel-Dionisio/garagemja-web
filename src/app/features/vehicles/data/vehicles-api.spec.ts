import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VehiclesApi, toVehicle } from './vehicles-api';

const vehicle = {
  id: 'v1',
  residentId: 'r1',
  plate: 'ABC1234',
  brand: 'Honda',
  model: 'Civic',
  color: null,
};

const residency = {
  id: 'r1',
  condominiumId: 'c1',
  condominiumName: 'Residencial Aurora',
  unit: '101',
  block: 'A',
  status: 'APPROVED',
};

describe('toVehicle', () => {
  it('maps a vehicle with optional fields', () => {
    expect(toVehicle(vehicle)).toEqual(vehicle);
    expect(toVehicle({ ...vehicle, brand: undefined }).brand).toBeNull();
  });

  it('rejects an invalid payload', () => {
    expect(() => toVehicle({ ...vehicle, plate: 1 })).toThrow('Invalid vehicle');
    expect(() => toVehicle(null)).toThrow();
  });
});

describe('VehiclesApi', () => {
  let api: VehiclesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(VehiclesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the vehicles of every residency with its condominium', () => {
    let result: unknown;
    api.listMine().subscribe((items) => (result = items));

    http.expectOne((req) => req.url === '/api/v1/me/residencies').flush([residency]);
    const request = http.expectOne(
      (req) => req.url === '/api/v1/vehicles' && req.params.get('residentId') === 'r1',
    );
    request.flush([vehicle]);

    expect(result).toEqual([
      {
        ...vehicle,
        residency: {
          id: 'r1',
          condominiumName: 'Residencial Aurora',
          unit: '101',
          block: 'A',
          approved: true,
        },
      },
    ]);
  });

  it('does not query vehicles when there is no residency', () => {
    let result: unknown;
    api.listMine().subscribe((items) => (result = items));

    http.expectOne((req) => req.url === '/api/v1/me/residencies').flush([]);
    expect(result).toEqual([]);
  });

  it('creates a vehicle omitting empty optional fields', () => {
    api.create('r1', { plate: 'ABC1234', brand: 'Honda', model: ' ', color: '' }).subscribe();

    const request = http.expectOne('/api/v1/vehicles');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      residentId: 'r1',
      plate: 'ABC1234',
      brand: 'Honda',
    });
    request.flush(vehicle);
  });

  it('updates a vehicle sending the trimmed values', () => {
    api.update('v1', { plate: 'ABC1234', brand: ' Honda ', model: 'Civic', color: '' }).subscribe();

    const request = http.expectOne('/api/v1/vehicles/v1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      plate: 'ABC1234',
      brand: 'Honda',
      model: 'Civic',
      color: '',
    });
    request.flush(vehicle);
  });

  it('loads a vehicle by id', () => {
    let plate = '';
    api.get('v1').subscribe((found) => (plate = found.plate));
    http.expectOne('/api/v1/vehicles/v1').flush(vehicle);
    expect(plate).toBe('ABC1234');
  });
});
