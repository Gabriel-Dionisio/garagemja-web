import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth-service';
import { Role } from './auth.model';

export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    return roles.some((role) => auth.hasRole(role))
      ? true
      : inject(Router).createUrlTree(['/home']);
  };
