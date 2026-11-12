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

  it('accepts accounts without phone or CPF', () => {
    let profile: unknown;
    api.get('admin-id').subscribe((value) => (profile = value));

    http.expectOne('/api/v1/users/admin-id').flush({
      id: 'admin-id',
      name: 'Admin',
      email: 'admin@example.com',
      phone: null,
      cpf: null,
    });
    expect(profile).toEqual({
      id: 'admin-id',
      name: 'Admin',
      email: 'admin@example.com',
      phone: '',
      cpf: '',
      photoUrl: null,
    });
  });

  it('rejects a payload without id, name or email', () => {
    let failed = false;
    api.get('x').subscribe({ error: () => (failed = true) });

    http.expectOne('/api/v1/users/x').flush({ id: 'x', phone: '16222222222' });
    expect(failed).toBe(true);
  });

  it('envia a foto como multipart e devolve o perfil com photoUrl', () => {
    let photoUrl: unknown;
    api
      .uploadPhoto('user-id', new File(['x'], 'a.png', { type: 'image/png' }))
      .subscribe((value) => (photoUrl = value.photoUrl));

    const request = http.expectOne('/api/v1/users/user-id/photo');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toBeInstanceOf(FormData);
    request.flush({ id: 'user-id', name: 'Ana', email: 'a@x.com', photoUrl: 'http://cdn/a.webp' });
    expect(photoUrl).toBe('http://cdn/a.webp');
  });

  it('remove a foto', () => {
    api.removePhoto('user-id').subscribe();
    const request = http.expectOne('/api/v1/users/user-id/photo');
    expect(request.request.method).toBe('DELETE');
    request.flush({ id: 'user-id', name: 'Ana', email: 'a@x.com', photoUrl: null });
  });
});
