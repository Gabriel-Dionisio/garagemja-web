import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Page, toPage } from '../../../shared/models/page';
import { SecurityEvent, TotpSetup, TotpStatus, isSecurityEventType } from '../security.model';

const SECURITY_URL = '/api/v1/me/security';

@Injectable({ providedIn: 'root' })
export class SecurityApi {
  private readonly http = inject(HttpClient);

  status(): Observable<TotpStatus> {
    return this.http.get<unknown>(`${SECURITY_URL}/totp`).pipe(map(toStatus));
  }

  setup(): Observable<TotpSetup> {
    return this.http.post<unknown>(`${SECURITY_URL}/totp/setup`, {}).pipe(map(toSetup));
  }

  confirm(code: string): Observable<string[]> {
    return this.http
      .post<unknown>(`${SECURITY_URL}/totp/confirm`, { code })
      .pipe(map(toRecoveryCodes));
  }

  disable(code: string): Observable<void> {
    return this.http.post<void>(`${SECURITY_URL}/totp/disable`, { code });
  }

  regenerateRecoveryCodes(code: string): Observable<string[]> {
    return this.http
      .post<unknown>(`${SECURITY_URL}/totp/recovery-codes`, { code })
      .pipe(map(toRecoveryCodes));
  }

  events(page: number, size: number): Observable<Page<SecurityEvent>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<unknown>(`${SECURITY_URL}/events`, { params, observe: 'response' }).pipe(
      map((response) => {
        if (!Array.isArray(response.body)) throw new Error('Invalid security events');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(
          response.body.map(toEvent),
          page,
          size,
          Number.isInteger(total) ? total : undefined,
        );
      }),
    );
  }
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid response');
  return Object.fromEntries(Object.entries(value));
}

export function toStatus(value: unknown): TotpStatus {
  const { enabled, recoveryCodesRemaining } = record(value);
  if (typeof enabled !== 'boolean' || typeof recoveryCodesRemaining !== 'number') {
    throw new Error('Invalid two-factor status');
  }
  return { enabled, recoveryCodesRemaining };
}

export function toSetup(value: unknown): TotpSetup {
  const { secret, otpauthUri } = record(value);
  if (typeof secret !== 'string' || typeof otpauthUri !== 'string') {
    throw new Error('Invalid two-factor setup');
  }
  return { secret, otpauthUri };
}

export function toRecoveryCodes(value: unknown): string[] {
  const { recoveryCodes } = record(value);
  if (!Array.isArray(recoveryCodes) || !recoveryCodes.every((c) => typeof c === 'string')) {
    throw new Error('Invalid recovery codes');
  }
  return recoveryCodes;
}

function toEvent(value: unknown): SecurityEvent {
  const { id, type, createdAt } = record(value);
  if (typeof id !== 'string' || !isSecurityEventType(type) || typeof createdAt !== 'string') {
    throw new Error('Invalid security event');
  }
  return { id, type, createdAt };
}
