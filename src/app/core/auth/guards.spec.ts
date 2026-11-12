import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthService } from './auth-service';
import { authGuard } from './auth-guard';
import { guestGuard } from './guest-guard';
import { homeGuard } from './home-guard';
import { Role } from './auth.model';
import { roleGuard } from './role-guard';

describe('guards', () => {
  const roles = signal<Role[] | null>(null);

  beforeEach(() => {
    roles.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => roles() !== null,
            hasRole: (role: Role) => roles()?.includes(role) ?? false,
          },
        },
      ],
    });
  });

  const run = (guard: typeof authGuard, url = '/admin/users') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  it('authGuard envia anônimos ao login guardando a rota pedida', () => {
    expect((run(authGuard) as UrlTree).toString()).toBe('/login?returnUrl=%2Fadmin%2Fusers');
    expect((run(authGuard, '/condominiums/c1') as UrlTree).toString()).toBe(
      '/login?returnUrl=%2Fcondominiums%2Fc1',
    );
    expect((run(authGuard, '/home') as UrlTree).toString()).toBe('/login');
    roles.set(['RESIDENT']);
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard manda autenticados para o início', () => {
    expect(run(guestGuard)).toBe(true);
    roles.set(['RESIDENT']);
    expect((run(guestGuard) as UrlTree).toString()).toBe('/home');
  });

  it('roleGuard libera só o papel exigido', () => {
    roles.set(['RESIDENT']);
    expect((run(roleGuard('ADMIN')) as UrlTree).toString()).toBe('/home');
    roles.set(['ADMIN']);
    expect(run(roleGuard('ADMIN'))).toBe(true);
  });

  it('roleGuard aceita qualquer um dos papéis e recusa os demais', () => {
    roles.set(['CONDOMINIUM_ADMIN']);
    expect(run(roleGuard('RESIDENT', 'CONDOMINIUM_ADMIN'))).toBe(true);
    roles.set(['ADMIN']);
    expect((run(roleGuard('RESIDENT', 'CONDOMINIUM_ADMIN')) as UrlTree).toString()).toBe('/home');
  });

  it('homeGuard leva o ADMIN ao painel e libera os demais', () => {
    roles.set(['ADMIN']);
    expect((run(homeGuard) as UrlTree).toString()).toBe('/dashboard');
    roles.set(['RESIDENT']);
    expect(run(homeGuard)).toBe(true);
  });
});
