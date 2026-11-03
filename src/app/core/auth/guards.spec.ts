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

  it('authGuard envia anônimos ao login guardando a rota', () => {
    const result = run(authGuard) as UrlTree;
    expect(result.toString()).toBe('/login?returnUrl=%2Fadmin%2Fusers');
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
});
