import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';

const PROFILE = {
  id: 'u1',
  name: 'Ana',
  email: 'a***@x.com',
  roles: ['RESIDENT'],
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca csrf antes e depois do login e guarda o usuário', () => {
    let result: unknown;
    service
      .login({ email: 'a@x.com', password: 'Abcdef1!', rememberMe: true })
      .subscribe((user) => (result = user));

    http.expectOne('/api/v1/auth/csrf').flush(null);
    const login = http.expectOne('/api/v1/auth/login');
    expect(login.request.body).toEqual({
      email: 'a@x.com',
      password: 'Abcdef1!',
      rememberMe: true,
    });
    login.flush(PROFILE);
    http.expectOne('/api/v1/auth/csrf').flush(null);

    expect(result).toEqual(PROFILE);
    expect(service.user()).toEqual(PROFILE);
    expect(service.hasRole('RESIDENT')).toBe(true);
    expect(service.hasRole('ADMIN')).toBe(false);
  });

  it('rejeita perfil inválido sem autenticar', () => {
    let failed = false;
    service.login({ email: 'a@x.com', password: 'x' }).subscribe({ error: () => (failed = true) });
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http
      .expectOne('/api/v1/auth/login')
      .flush({ id: 'u1', name: 'Ana', email: 'e', roles: ['ROOT'] });
    expect(failed).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('trata 401 de /me como anônimo', () => {
    let result: unknown = 'pendente';
    service.loadSession().subscribe((user) => (result = user));
    http.expectOne('/api/v1/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(result).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('compartilha uma única renovação entre chamadas simultâneas', () => {
    service.refreshSession().subscribe();
    service.refreshSession().subscribe();
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null);
  });

  it('limpa o usuário quando a renovação falha', () => {
    service.loadSession().subscribe();
    http.expectOne('/api/v1/auth/me').flush(PROFILE);
    service.refreshSession().subscribe({ error: () => undefined });
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(service.user()).toBeNull();
  });

  it('mantém a sessão quando o logout falha', () => {
    service.loadSession().subscribe();
    http.expectOne('/api/v1/auth/me').flush(PROFILE);
    service.logout().subscribe({ error: () => undefined });
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/logout').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(service.user()).toEqual(PROFILE);
  });

  it('encerra a sessão no logout bem-sucedido', () => {
    service.loadSession().subscribe();
    http.expectOne('/api/v1/auth/me').flush(PROFILE);
    service.logout().subscribe();
    http.expectOne('/api/v1/auth/csrf').flush(null);
    http.expectOne('/api/v1/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    http.expectOne('/api/v1/auth/csrf').flush(null);
    expect(service.user()).toBeNull();
  });
});
