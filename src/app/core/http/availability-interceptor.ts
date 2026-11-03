import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { ApiAvailability, STATUS_URL } from './api-availability';
import { REPORT_ONLY } from './availability-context';

const SUSPECT_STATUSES = new Set([0, 500, 502, 503, 504]);
const REPLAYABLE_METHODS = new Set(['GET', 'HEAD']);

export const availabilityInterceptor: HttpInterceptorFn = (request, next) => {
  const availability = inject(ApiAvailability);
  return next(request).pipe(
    catchError((error: unknown) => {
      const suspect =
        error instanceof HttpErrorResponse &&
        SUSPECT_STATUSES.has(error.status) &&
        !request.url.startsWith(STATUS_URL);
      if (!suspect) return throwError(() => error);
      if (!REPLAYABLE_METHODS.has(request.method) || request.context.get(REPORT_ONLY)) {
        availability.report();
        return throwError(() => error);
      }
      return availability
        .reportAndWait()
        .pipe(switchMap((recovered) => (recovered ? next(request) : throwError(() => error))));
    }),
  );
};
