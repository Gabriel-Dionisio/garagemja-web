import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RentalsApi, toRental } from './rentals-api';

const row = {
  id: 'r1',
  condominiumName: 'Residencial Aurora',
  parkingSpotNumber: 'A-01',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  price: 8,
  status: 'PENDING',
};

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

  it('lists the renter rentals with paging, status filter and total', () => {
    let total: number | undefined;
    api.list(1, 10, 'PENDING').subscribe((page) => (total = page.total));

    const request = http.expectOne(
      (req) => req.url === '/api/v1/me/rentals' && req.params.get('status') === 'PENDING',
    );
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    request.flush([row], { headers: { 'X-Total-Count': '11' } });
    expect(total).toBe(11);
  });

  it('omits the status parameter when no filter is selected', () => {
    api.list(0, 25, null).subscribe();

    const request = http.expectOne((req) => req.url === '/api/v1/me/rentals');
    expect(request.request.params.has('status')).toBe(false);
    request.flush([]);
  });

  it('rejects malformed rentals', () => {
    expect(() => toRental({ ...row, status: 'UNKNOWN' })).toThrow();
    expect(() => toRental({ ...row, price: 'free' })).toThrow();
    expect(() => toRental({ ...row, id: undefined })).toThrow();
  });
});
