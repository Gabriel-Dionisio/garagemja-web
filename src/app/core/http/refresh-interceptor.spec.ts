import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { refreshInterceptor } from './refresh-interceptor';

describe('refreshInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([refreshInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  const unauthorized = { status: 401, statusText: 'Unauthorized' };

  it('renova a sessão e repete a requisição uma vez', () => {
    let body: unknown;
    client.get('/users').subscribe((value) => (body = value));

    http.expectOne('/users').flush(null, unauthorized);
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null);
    http.expectOne('/users').flush({ ok: true });

    expect(body).toEqual({ ok: true });
  });

  it('vai ao login quando a renovação falha', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let status = 0;
    client.get('/users').subscribe({ error: (error) => (status = error.status) });

    http.expectOne('/users').flush(null, unauthorized);
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null, unauthorized);

    expect(status).toBe(401);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('não tenta renovar em login, logout nem em renovação', () => {
    let status = 0;
    client.post('/api/v1/auth/login', {}).subscribe({ error: (error) => (status = error.status) });
    http.expectOne('/api/v1/auth/login').flush(null, unauthorized);
    expect(status).toBe(401);

    status = 0;
    client.post('/api/v1/auth/logout', {}).subscribe({ error: (error) => (status = error.status) });
    http.expectOne('/api/v1/auth/logout').flush(null, unauthorized);
    expect(status).toBe(401);
  });

  it('mantém a sessão quando a renovação falha por limite (429)', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    let status = 0;
    client.get('/users').subscribe({ error: (error) => (status = error.status) });

    http.expectOne('/users').flush(null, unauthorized);
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null, { status: 429, statusText: 'Too Many' });

    expect(status).toBe(401);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('propaga o erro real quando a requisição repetida falha', () => {
    let status = 0;
    client.get('/users').subscribe({ error: (error) => (status = error.status) });

    http.expectOne('/users').flush(null, unauthorized);
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null);
    http.expectOne('/users').flush(null, { status: 422, statusText: 'Unprocessable' });

    expect(status).toBe(422);
  });

  it('não vai ao login quando a sondagem de sessão não está autenticada', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    client.get('/api/v1/auth/me').subscribe({ error: () => undefined });

    http.expectOne('/api/v1/auth/me').flush(null, unauthorized);
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null, unauthorized);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('não tenta renovar a sessão nas rotas de status', () => {
    let status = 0;
    client.get('/api/v1/status').subscribe({ error: (error) => (status = error.status) });
    http.expectOne('/api/v1/status').flush(null, unauthorized);
    expect(status).toBe(401);
  });

  it('compartilha uma única renovação entre 401 simultâneos', () => {
    client.get('/a').subscribe();
    client.get('/b').subscribe();

    http.expectOne('/a').flush(null, unauthorized);
    http.expectOne('/b').flush(null, unauthorized);
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null);
    http.expectOne('/a').flush({});
    http.expectOne('/b').flush({});
  });
});
