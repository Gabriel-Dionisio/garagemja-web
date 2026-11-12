import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, tap } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth-service';
import { Role, UserProfile } from './core/auth/auth.model';

describe('app routes', () => {
  const user = signal<UserProfile | null>(null);
  const profile = {
    id: 'u1',
    name: 'Ana',
    email: 'ana@x.com',
    roles: ['RESIDENT'] as Role[],
    photoUrl: null,
  };

  beforeEach(() => {
    user.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            user,
            isAuthenticated: computed(() => user() !== null),
            hasRole: (role: Role) => user()?.roles.includes(role) ?? false,
            login: () => of(profile as UserProfile).pipe(tap((value) => user.set(value))),
          },
        },
      ],
    });
  });

  it('leva quem está logado de /join/:code ao formulário com o código', async () => {
    user.set(profile);
    await RouterTestingHarness.create('/join/ABC');
    expect(TestBed.inject(Router).url).toBe('/condominiums?code=ABC');
  });

  it('volta ao código de entrada após o login de quem abriu /join/:code deslogado', async () => {
    const harness = await RouterTestingHarness.create('/join/ABC');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/login?returnUrl=%2Fcondominiums%3Fcode%3DABC');

    const element = harness.routeNativeElement as HTMLElement;
    const fill = (label: string, value: string) => {
      const input = Array.from(element.querySelectorAll('label'))
        .find((item) => item.textContent?.trim() === label)
        ?.parentElement?.querySelector('input') as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    fill('E-mail', 'ana@x.com');
    fill('Senha', 'Abcdef1!');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();

    expect(router.url).toBe('/condominiums?code=ABC');
  });
});
