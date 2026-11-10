import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Vacancy } from '../search-vacancies.model';
import { SearchVacanciesApi, toVacancies } from './search-vacancies-api';

const spot = (id: string, condominiumId = 'c1', extra = {}) => ({
  id,
  condominiumId,
  number: id,
  location: null,
  size: null,
  ...extra,
});
const condominium = {
  id: 'c1',
  name: 'Residencial Alpha',
  address: 'Rua A, 10',
  city: 'Campinas',
  state: 'SP',
};
const availability = (
  parkingSpotId: string,
  price: string,
  startDate: string,
  endDate: string,
  active = true,
) => ({ parkingSpotId, price, startDate, endDate, active });

describe('toVacancies', () => {
  const today = '2026-11-10';

  it('combina vaga, condomínio e a disponibilidade vigente', () => {
    const [result] = toVacancies(
      [spot('s1', 'c1', { location: ' Bloco A ', size: 'MEDIUM' })],
      [condominium],
      [availability('s1', '8.50', '2026-01-01', '2026-12-31')],
      today,
    );
    expect(result).toEqual({
      id: 's1',
      number: 's1',
      block: 'Bloco A',
      condominiumName: 'Residencial Alpha',
      address: 'Rua A, 10, Campinas, SP',
      size: 'MEDIUM',
      price: 8.5,
      priceUnit: null,
      available: true,
      imageUrl: null,
    } satisfies Vacancy);
  });

  it('marca como indisponível sem disponibilidade vigente ou futura, sem inventar preço', () => {
    const [result] = toVacancies(
      [spot('s1')],
      [condominium],
      [
        availability('s1', '8.00', '2025-01-01', '2025-12-31'),
        availability('s1', '7.00', '2026-01-01', '2026-12-31', false),
      ],
      today,
    );
    expect(result.available).toBe(false);
    expect(result.price).toBeNull();
  });

  it('usa a próxima disponibilidade quando nenhuma está vigente', () => {
    const [result] = toVacancies(
      [spot('s1')],
      [condominium],
      [availability('s1', '9.00', '2027-01-01', '2027-06-30')],
      today,
    );
    expect(result.available).toBe(true);
    expect(result.price).toBe(9);
  });

  it('descarta vagas de condomínios desconhecidos', () => {
    expect(toVacancies([spot('s1', 'x')], [condominium], [], today)).toEqual([]);
  });
});

describe('SearchVacanciesApi', () => {
  let api: SearchVacanciesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SearchVacanciesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta vagas ativas, condomínios e disponibilidades ativas', () => {
    let result: Vacancy[] | undefined;
    api.loadAll().subscribe((value) => (result = value));

    const spots = http.expectOne((r) => r.url === '/api/v1/parking-spots');
    expect(spots.request.params.get('status')).toBe('ACTIVE');
    spots.flush([spot('s1')]);
    http.expectOne('/api/v1/condominiums').flush([condominium]);
    const availabilities = http.expectOne((r) => r.url === '/api/v1/spot-availabilities');
    expect(availabilities.request.params.get('active')).toBe('true');
    availabilities.flush([availability('s1', '8.00', '2000-01-01', '2999-12-31')]);

    expect(result).toHaveLength(1);
    expect(result?.[0].price).toBe(8);
  });

  it('propaga erro de qualquer das consultas', () => {
    let failed = false;
    api.loadAll().subscribe({ error: () => (failed = true) });
    http
      .expectOne((r) => r.url === '/api/v1/parking-spots')
      .flush(null, { status: 500, statusText: 'Server Error' });
    expect(failed).toBe(true);
    // As demais consultas são canceladas pelo forkJoin.
    http.match(() => true);
  });

  it('rejeita respostas que não são listas', () => {
    let failed = false;
    api.loadAll().subscribe({ error: () => (failed = true) });
    http.expectOne((r) => r.url === '/api/v1/parking-spots').flush({ items: [] });
    http.expectOne('/api/v1/condominiums').flush([]);
    http.expectOne((r) => r.url === '/api/v1/spot-availabilities').flush([]);
    expect(failed).toBe(true);
  });
});
