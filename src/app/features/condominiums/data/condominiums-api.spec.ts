import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CondominiumsApi } from './condominiums-api';

describe('CondominiumsApi', () => {
  let api: CondominiumsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CondominiumsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('filters the list by status', () => {
    api.list({ status: 'PENDING' }, 0, 20).subscribe();
    const request = http.expectOne((r) => r.url === '/api/v1/condominiums');
    expect(request.request.params.get('status')).toBe('PENDING');
    request.flush([]);
  });

  it('rejects a list that is not an array', () => {
    const error = vi.fn();
    api.list({}, 0, 20).subscribe({ error });
    http.expectOne((r) => r.url === '/api/v1/condominiums').flush({});
    expect(error).toHaveBeenCalled();
  });

  it('sends the invite e-mail to the condominium invites route', () => {
    api.invite('c1', 'ana@example.test').subscribe();
    const request = http.expectOne('/api/v1/condominiums/c1/manager-invites');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.test' });
    request.flush(null);
  });

  it('answers my invites on the me routes', () => {
    api.acceptInvite('i1').subscribe();
    api.declineInvite('i2').subscribe();
    http.expectOne('/api/v1/me/manager-invites/i1/accept').flush(null);
    http.expectOne('/api/v1/me/manager-invites/i2/decline').flush(null);
  });

  it('rejects a malformed manager list', () => {
    const error = vi.fn();
    api.managers('c1').subscribe({ error });
    http.expectOne('/api/v1/condominiums/c1/managers').flush({ not: 'a list' });
    expect(error).toHaveBeenCalled();
  });

  it('sends the removal reason as a query param', () => {
    api.removeManager('c1', 'u1', 'abuso').subscribe();
    const request = http.expectOne((r) => r.url === '/api/v1/condominiums/c1/managers/u1');
    expect(request.request.params.get('reason')).toBe('abuso');
    request.flush(null);
  });

  it('posts the manager transfer', () => {
    const transfer = { fromUserId: 'u1', email: 'a@b.c', reason: 'disputa' };
    api.transferManager('c1', transfer).subscribe();
    const request = http.expectOne('/api/v1/condominiums/c1/managers/transfer');
    expect(request.request.body).toEqual(transfer);
    request.flush(null);
  });

  it('rejects malformed counts', () => {
    const error = vi.fn();
    api.counts('c1').subscribe({ error });
    http.expectOne('/api/v1/condominiums/c1/counts').flush({ residents: 'x' });
    expect(error).toHaveBeenCalled();
  });
});
