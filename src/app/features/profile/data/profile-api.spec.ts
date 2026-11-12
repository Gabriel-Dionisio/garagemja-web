import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProfileApi } from './profile-api';

describe('ProfileApi', () => {
  let api: ProfileApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProfileApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia somente os números ao atualizar o telefone', () => {
    api.update('user-id', { phone: '16222222222' }).subscribe();

    const request = http.expectOne('/api/v1/users/user-id');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ phone: '16222222222' });
    request.flush({
      id: 'user-id',
      name: 'Usuário Teste',
      email: 'usuario@example.com',
      phone: '(16) 22222-2222',
    });
  });
});
