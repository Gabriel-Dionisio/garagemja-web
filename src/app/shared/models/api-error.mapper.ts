import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, FieldError } from './api-error';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? Object.fromEntries(Object.entries(value))
    : null;
}

function parseFieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = asRecord(entry);
    return item && typeof item['field'] === 'string' && typeof item['message'] === 'string'
      ? [{ field: item['field'], message: item['message'] }]
      : [];
  });
}

function parseRetryAfter(error: HttpErrorResponse): number | null {
  const seconds = Number(error.headers?.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      message: null,
      code: null,
      fieldErrors: [],
      retryAfterSeconds: null,
    };
  }
  const body = asRecord(error.error);
  const serverMessage = body && typeof body['message'] === 'string' ? body['message'] : null;
  return {
    status: error.status,
    message: serverMessage,
    code: body && typeof body['code'] === 'string' ? body['code'] : null,
    fieldErrors: parseFieldErrors(body?.['errors']),
    retryAfterSeconds: parseRetryAfter(error),
  };
}
