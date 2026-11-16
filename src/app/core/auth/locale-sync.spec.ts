import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LocaleService } from '../i18n/locale-service';
import { AuthService } from './auth-service';
import { LocaleSync } from './locale-sync';

describe('LocaleSync', () => {
  function setup(userId: string | null) {
    const language = signal<'pt-BR' | 'en'>('pt-BR');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocaleService, useValue: { language } },
        { provide: AuthService, useValue: { user: signal(userId ? { id: userId } : null) } },
      ],
    });
    TestBed.inject(LocaleSync);
    return { language, http: TestBed.inject(HttpTestingController) };
  }

  it('grava o idioma do usuário logado e de novo quando muda', () => {
    const { language, http } = setup('u1');
    TestBed.tick();
    http.expectOne('/api/v1/users/u1').flush({});
    language.set('en');
    TestBed.tick();
    const request = http.expectOne('/api/v1/users/u1');
    expect(request.request.body).toEqual({ locale: 'en' });
    request.flush({});
    http.verify();
  });

  it('não chama a API sem sessão', () => {
    const { http } = setup(null);
    TestBed.tick();
    http.verify();
  });
});
