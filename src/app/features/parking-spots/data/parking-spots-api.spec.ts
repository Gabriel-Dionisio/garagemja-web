import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ParkingSpotsApi } from './parking-spots-api';

describe('ParkingSpotsApi', () => {
  let api: ParkingSpotsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ParkingSpotsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia busca, status, tamanho e mine quando preenchidos', () => {
    api
      .list(null, { status: 'ACTIVE', size: 'SMALL', search: '23', mine: true }, 1, 10)
      .subscribe();

    const req = http.expectOne((r) => r.url === '/api/v1/parking-spots');
    const { params } = req.request;
    expect(params.get('search')).toBe('23');
    expect(params.get('status')).toBe('ACTIVE');
    expect(params.get('spotSize')).toBe('SMALL');
    expect(params.get('mine')).toBe('true');
    expect(params.has('condominiumId')).toBe(false);
    req.flush([]);
  });

  it('omite busca vazia e filtros nulos', () => {
    api.list('c1', { status: null, size: null, search: '', mine: false }, 0, 25).subscribe();

    const req = http.expectOne((r) => r.url === '/api/v1/parking-spots');
    expect(req.request.params.get('condominiumId')).toBe('c1');
    expect(req.request.params.keys().sort()).toEqual(['condominiumId', 'page', 'size']);
    req.flush([]);
  });
});
