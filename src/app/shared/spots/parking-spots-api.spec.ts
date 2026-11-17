import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_CRITERIA } from './spot-search.model';
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

  it('envia coberta e condomínio na busca de vagas', () => {
    api.search({ ...DEFAULT_CRITERIA, covered: true, condominiumId: 'c1' }, 0, 12).subscribe();

    const req = http.expectOne((r) => r.url === '/api/v1/parking-spots');
    expect(req.request.params.get('covered')).toBe('true');
    expect(req.request.params.get('condominiumId')).toBe('c1');
    req.flush([]);
  });

  it('lê os pinos do mapa e rejeita resposta inválida', () => {
    let pins: unknown;
    let failed = false;
    api
      .mapPins({ ...DEFAULT_CRITERIA, covered: true, search: 'sol' })
      .subscribe({ next: (value) => (pins = value), error: () => (failed = true) });
    const request = http.expectOne((req) => req.url === '/api/v1/parking-spots/map');
    expect(request.request.params.get('covered')).toBe('true');
    expect(request.request.params.get('search')).toBe('sol');
    expect(request.request.params.get('available')).toBe('true');
    request.flush([
      { condominiumId: 'c1', name: 'Solar', latitude: -23.5, longitude: -46.6, available: 3 },
    ]);
    expect(pins).toEqual([
      { condominiumId: 'c1', name: 'Solar', latitude: -23.5, longitude: -46.6, available: 3 },
    ]);

    api.mapPins(DEFAULT_CRITERIA).subscribe({ error: () => (failed = true) });
    http.expectOne((req) => req.url === '/api/v1/parking-spots/map').flush([{ name: 1 }]);
    expect(failed).toBe(true);
  });

  it('reordena as imagens da vaga', () => {
    let ids: string[] = [];
    api.reorderImages('s1', ['b', 'a']).subscribe((images) => (ids = images.map(({ id }) => id)));
    const request = http.expectOne('/api/v1/parking-spots/s1/images/order');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ imageIds: ['b', 'a'] });
    request.flush([
      { id: 'b', url: '/b.png', thumbnailUrl: null, position: 0 },
      { id: 'a', url: '/a.png', thumbnailUrl: null, position: 1 },
    ]);
    expect(ids).toEqual(['b', 'a']);
  });
});
