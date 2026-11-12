import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service';
import { STATUS_URL } from './api-availability';

const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/login/second-factor',
  '/auth/register',
  '/auth/resend-verification',
  '/auth/csrf',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
];
const SESSION_PROBE_PATH = '/auth/me';

export const refreshInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      const unauthorized = error instanceof HttpErrorResponse && error.status === 401;
      if (
        !unauthorized ||
        request.url.startsWith(STATUS_URL) ||
        NO_REFRESH_PATHS.some((path) => request.url.endsWith(path))
      ) {
        return throwError(() => error);
      }
      return auth.refreshSession().pipe(
        catchError((refreshError: unknown) => {
          const sessionExpired =
            refreshError instanceof HttpErrorResponse && refreshError.status === 401;
          if (sessionExpired && !request.url.endsWith(SESSION_PROBE_PATH)) {
            void router.navigate(['/login']);
          }
          return throwError(() =>
            refreshError instanceof HttpErrorResponse ? error : refreshError,
          );
        }),
        switchMap(() => next(request)),
      );
    }),
  );
};
