import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  const keepsReturn = state.url !== '/' && state.url !== '/home';
  return router.createUrlTree(
    ['/login'],
    keepsReturn ? { queryParams: { returnUrl: state.url } } : {},
  );
};
