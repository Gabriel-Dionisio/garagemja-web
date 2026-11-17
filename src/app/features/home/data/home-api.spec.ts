import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HomeApi } from './home-api';

describe('HomeApi', () => {
  let api: HomeApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(HomeApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the residency total from the header', () => {
    const result = vi.fn();
    api.residencyCount().subscribe(result);
    const request = http.expectOne((r) => r.url === '/api/v1/me/residencies');
    expect(request.request.params.get('size')).toBe('1');
    request.flush([{}], { headers: { 'X-Total-Count': '3' } });
    expect(result).toHaveBeenCalledWith(3);
  });

  it('falls back to the body length without the header', () => {
    const result = vi.fn();
    api.residencyCount().subscribe(result);
    http.expectOne((r) => r.url === '/api/v1/me/residencies').flush([{}, {}]);
    expect(result).toHaveBeenCalledWith(2);
  });

  it('rejects a malformed list', () => {
    const error = vi.fn();
    api.residencyCount().subscribe({ error });
    http.expectOne((r) => r.url === '/api/v1/me/residencies').flush({});
    expect(error).toHaveBeenCalled();
  });
});
