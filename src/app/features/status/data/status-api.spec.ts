import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StatusApi } from './status-api';

describe('StatusApi', () => {
  let api: StatusApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StatusApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('converte a resposta saudável', () => {
    let state = '';
    api.load().subscribe((status) => (state = status.state));
    http
      .expectOne('/api/v1/status')
      .flush({ status: 'UP', version: '1.0.0', components: { database: 'UP' } });
    expect(state).toBe('up');
  });

  it('usa o corpo DOWN de um 503', () => {
    let result = { state: '', components: [] as { name: string; up: boolean }[] };
    api.load().subscribe((status) => (result = status));
    http
      .expectOne('/api/v1/status')
      .flush(
        { status: 'DOWN', components: { database: 'DOWN' } },
        { status: 503, statusText: 'Unavailable' },
      );
    expect(result.state).toBe('down');
    expect(result.components).toEqual([{ name: 'database', up: false }]);
  });

  it('marca inalcançável sem corpo válido', () => {
    let state = '';
    api.load().subscribe((status) => (state = status.state));
    http.expectOne('/api/v1/status').flush(null, { status: 502, statusText: 'Bad Gateway' });
    expect(state).toBe('unreachable');
  });

  it('converte o histórico e descarta tudo se um bucket for inválido', () => {
    const results: unknown[] = [];
    api.history().subscribe((history) => results.push(history));
    api.history().subscribe((history) => results.push(history));
    const [valid, invalid] = http.match('/api/v1/status/history');
    valid.flush({
      bucketMinutes: 30,
      uptimePercent: 99.5,
      buckets: [{ start: '2026-11-01T10:00:00Z', state: 'UP' }],
    });
    invalid.flush({
      bucketMinutes: 30,
      uptimePercent: 99.5,
      buckets: [{ start: 'not-a-date', state: 'UP' }],
    });
    expect(results[0]).toMatchObject({ bucketMinutes: 30, uptimePercent: 99.5 });
    expect(results[1]).toBeNull();
  });

  it('devolve nulo quando o histórico falha', () => {
    let result: unknown = 'pending';
    api.history().subscribe((history) => (result = history));
    http.expectOne('/api/v1/status/history').flush(null, { status: 500, statusText: 'Error' });
    expect(result).toBeNull();
  });
});
