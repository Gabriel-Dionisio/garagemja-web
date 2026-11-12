import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HomeApi } from './home-api';

describe('HomeApi', () => {
  let api: HomeApi;
  let http: HttpTestingController;
  const residencies = (r: { url: string }) => r.url === '/api/v1/me/residencies';
  const featured = '/api/v1/me/featured-condominiums';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(HomeApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('combines the residency total with the featured condominiums', () => {
    const result = vi.fn();
    api.loadMine().subscribe(result);

    const count = http.expectOne(residencies);
    expect(count.request.params.get('page')).toBe('0');
    expect(count.request.params.get('size')).toBe('1');
    count.flush([{}], { headers: { 'X-Total-Count': '3' } });
    http.expectOne(featured).flush([
      { id: 'c1', name: 'Alpha', availableVagas: 4, pricePerHour: 7.5, imageUrl: null },
      { id: 'c2', name: 'Beta', availableVagas: 1 },
    ]);

    expect(result).toHaveBeenCalledWith({
      residencies: 3,
      condominiums: [
        { id: 'c1', name: 'Alpha', availableVagas: 4, pricePerHour: 7.5, imageUrl: null },
        { id: 'c2', name: 'Beta', availableVagas: 1, pricePerHour: null, imageUrl: null },
      ],
    });
  });

  it('reports no residency when the total is zero', () => {
    const result = vi.fn();
    api.loadMine().subscribe(result);
    http.expectOne(residencies).flush([], { headers: { 'X-Total-Count': '0' } });
    http.expectOne(featured).flush([]);
    expect(result).toHaveBeenCalledWith({ residencies: 0, condominiums: [] });
  });

  it('rejects an invalid featured item', () => {
    const error = vi.fn();
    api.loadMine().subscribe({ error });
    http.expectOne(residencies).flush([], { headers: { 'X-Total-Count': '1' } });
    http.expectOne(featured).flush([{ id: 'c1', name: 'Alpha', availableVagas: '4' }]);
    expect(error).toHaveBeenCalled();
  });

  it('rejects a featured response that is not a list', () => {
    const error = vi.fn();
    api.loadMine().subscribe({ error });
    http.expectOne(residencies).flush([], { headers: { 'X-Total-Count': '1' } });
    http.expectOne(featured).flush({});
    expect(error).toHaveBeenCalled();
  });
});
