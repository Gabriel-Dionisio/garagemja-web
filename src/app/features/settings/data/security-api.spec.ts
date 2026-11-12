import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SecurityApi } from './security-api';

describe('SecurityApi', () => {
  let api: SecurityApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SecurityApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lê o status do segundo fator', () => {
    let result: unknown;
    api.status().subscribe((status) => (result = status));
    http.expectOne('/api/v1/me/security/totp').flush({ enabled: true, recoveryCodesRemaining: 7 });
    expect(result).toEqual({ enabled: true, recoveryCodesRemaining: 7 });
  });

  it('confirma o código e devolve os códigos de recuperação', () => {
    let result: unknown;
    api.confirm('123456').subscribe((codes) => (result = codes));
    const request = http.expectOne('/api/v1/me/security/totp/confirm');
    expect(request.request.body).toEqual({ code: '123456' });
    request.flush({ recoveryCodes: ['AAAAA-BBBBB'] });
    expect(result).toEqual(['AAAAA-BBBBB']);
  });

  it('regenera os códigos com um código válido', () => {
    let result: unknown;
    api.regenerateRecoveryCodes('123456').subscribe((codes) => (result = codes));
    const request = http.expectOne('/api/v1/me/security/totp/recovery-codes');
    expect(request.request.body).toEqual({ code: '123456' });
    request.flush({ recoveryCodes: ['CCCCC-DDDDD'] });
    expect(result).toEqual(['CCCCC-DDDDD']);
  });

  it('pagina os eventos usando o total do cabeçalho', () => {
    let result: unknown;
    api.events(0, 10).subscribe((page) => (result = page));
    const request = http.expectOne((r) => r.url === '/api/v1/me/security/events');
    expect(request.request.params.get('size')).toBe('10');
    request.flush([{ id: 'e1', type: 'LOGIN', createdAt: '2026-11-12T10:00:00Z' }], {
      headers: { 'X-Total-Count': '25' },
    });
    expect(result).toMatchObject({ total: 25, hasNext: true, items: [{ type: 'LOGIN' }] });
  });

  it('rejeita evento de tipo desconhecido', () => {
    let failed = false;
    api.events(0, 10).subscribe({ error: () => (failed = true) });
    http
      .expectOne((r) => r.url === '/api/v1/me/security/events')
      .flush([{ id: 'e1', type: 'NOPE', createdAt: 'x' }]);
    expect(failed).toBe(true);
  });
});
