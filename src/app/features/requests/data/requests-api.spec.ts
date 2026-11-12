import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RequestsApi } from './requests-api';

const row = {
  id: 'r1',
  condominiumId: 'c1',
  condominiumName: 'Residencial Aurora',
  parkingSpotId: 's1',
  parkingSpotNumber: 'A-01',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  price: 8,
  status: 'PENDING',
};

describe('RequestsApi', () => {
  let api: RequestsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RequestsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the requests received for the owner spots by status', () => {
    let total: number | undefined;
    api.list(0, 25, 'PENDING').subscribe((page) => (total = page.total));

    const request = http.expectOne(
      (req) => req.url === '/api/v1/me/owned-rentals' && req.params.get('status') === 'PENDING',
    );
    expect(request.request.params.get('size')).toBe('25');
    request.flush([row], { headers: { 'X-Total-Count': '1' } });
    expect(total).toBe(1);
  });

  it.each(['APPROVED', 'REFUSED'] as const)('sends the %s decision to the rental', (decision) => {
    let done = false;
    api.decide('r1', decision).subscribe(() => (done = true));

    const request = http.expectOne('/api/v1/rentals/r1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: decision });
    request.flush({ ...row, status: decision });
    expect(done).toBe(true);
  });
});
