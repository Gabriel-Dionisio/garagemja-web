import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { ApiAvailability } from './api-availability';
import { availabilityInterceptor } from './availability-interceptor';
import { HttpClient } from '@angular/common/http';

describe('ApiAvailability', () => {
  let http: HttpTestingController;
  let availability: ApiAvailability;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([availabilityInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    availability = TestBed.inject(ApiAvailability);
  });

  it('fica indisponível quando uma falha de rede é confirmada pelo health', () => {
    TestBed.inject(HttpClient)
      .get('/api/v1/auth/me')
      .subscribe({ error: () => undefined });
    http.expectOne('/api/v1/auth/me').error(new ProgressEvent('error'));
    http.expectOne('/api/v1/status').flush(null, { status: 503, statusText: 'Down' });
    expect(availability.unavailable()).toBe(true);
    expect(availability.secondsLeft()).toBe(5);
  });

  it('não mostra a tela quando o health responde UP', () => {
    TestBed.inject(HttpClient)
      .get('/x')
      .subscribe({ error: () => undefined });
    http.expectOne('/x').flush(null, { status: 500, statusText: 'Error' });
    http.expectOne('/api/v1/status').flush({ status: 'UP', version: '1.0.0' });
    expect(availability.unavailable()).toBe(false);
  });

  it('volta ao normal quando a nova tentativa encontra a API no ar', () => {
    availability.report();
    http.expectOne('/api/v1/status').flush(null, { status: 503, statusText: 'Down' });
    availability.retryNow();
    http.expectOne('/api/v1/status').flush({ status: 'UP', version: '1.0.0' });
    expect(availability.unavailable()).toBe(false);
  });

  it('refaz o GET que falhou quando a API volta', () => {
    const result: unknown[] = [];
    TestBed.inject(HttpClient)
      .get('/api/v1/users')
      .subscribe((body) => result.push(body));
    http.expectOne('/api/v1/users').error(new ProgressEvent('error'));
    http.expectOne('/api/v1/status').flush(null, { status: 503, statusText: 'Down' });
    availability.retryNow();
    http.expectOne('/api/v1/status').flush({ status: 'UP', version: '1.0.0' });
    http.expectOne('/api/v1/users').flush({ ok: true });
    expect(result).toEqual([{ ok: true }]);
  });

  it('não refaz POST nem espera a volta da API', () => {
    let failed = false;
    TestBed.inject(HttpClient)
      .post('/api/v1/users', {})
      .subscribe({ error: () => (failed = true) });
    http.expectOne('/api/v1/users').error(new ProgressEvent('error'));
    expect(failed).toBe(true);
  });
});
