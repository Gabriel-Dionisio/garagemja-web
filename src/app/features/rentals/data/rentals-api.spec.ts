import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RentalCard } from '../rental.model';
import { RentalsApi } from './rentals-api';

describe('RentalsApi', () => {
  let api: RentalsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RentalsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the signed-in user rentals and resolves spot and condominium details', () => {
    let result: RentalCard[] | undefined;
    api.loadForUser('user-1').subscribe((rentals) => (result = rentals));

    http
      .expectOne(
        (request) =>
          request.url === '/api/v1/residents' && request.params.get('userId') === 'user-1',
      )
      .flush([{ id: 'resident-1', userId: 'user-1' }]);

    http
      .expectOne(
        (request) =>
          request.url === '/api/v1/rentals' &&
          request.params.get('renterResidentId') === 'resident-1',
      )
      .flush([
        {
          id: 'rental-1',
          condominiumId: 'condominium-1',
          parkingSpotId: 'spot-1',
          renterResidentId: 'resident-1',
          startDate: '2026-10-01',
          endDate: '2026-10-02',
          price: 8,
          status: 'ACTIVE',
          createdAt: '2026-09-01T10:00:00Z',
        },
      ]);

    http.expectOne('/api/v1/parking-spots/spot-1').flush({
      id: 'spot-1',
      number: '23',
      location: 'Bloco A',
    });
    http.expectOne('/api/v1/condominiums/condominium-1').flush({
      id: 'condominium-1',
      name: 'Residencial Alpha',
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 'rental-1',
        parkingSpotNumber: '23',
        parkingSpotLocation: 'Bloco A',
        condominiumName: 'Residencial Alpha',
        price: 8,
        status: 'ACTIVE',
      }),
    ]);
  });

  it('does not request rentals when the authenticated user has no residents', () => {
    let result: RentalCard[] | undefined;
    api.loadForUser('user-1').subscribe((rentals) => (result = rentals));

    http
      .expectOne(
        (request) =>
          request.url === '/api/v1/residents' && request.params.get('userId') === 'user-1',
      )
      .flush([]);

    expect(result).toEqual([]);
    http.expectNone('/api/v1/rentals');
  });
});
