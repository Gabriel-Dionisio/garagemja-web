import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../auth/auth-service';

const MANAGED_URL = '/api/v1/me/managed-condominiums';
const INVITES_URL = '/api/v1/me/manager-invites';

export function sumPendingResidents(body: unknown): number {
  if (!Array.isArray(body)) return 0;
  return body.reduce<number>((total, item) => {
    const pending: unknown =
      typeof item === 'object' && item !== null
        ? Object.fromEntries(Object.entries(item))['pendingResidents']
        : 0;
    return total + (typeof pending === 'number' ? pending : 0);
  }, 0);
}

@Injectable({ providedIn: 'root' })
export class NavBadges {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly count = signal(0);

  readonly condominiums = this.count.asReadonly();

  refresh(): void {
    if (!this.auth.isAuthenticated() || this.auth.hasRole('ADMIN')) {
      this.count.set(0);
      return;
    }
    const params = new HttpParams().set('size', 100);
    forkJoin({
      pending: this.auth.hasRole('CONDOMINIUM_ADMIN')
        ? this.http.get<unknown>(MANAGED_URL, { params }).pipe(
            map(sumPendingResidents),
            catchError(() => of(0)),
          )
        : of(0),
      invites: this.http.get<unknown>(INVITES_URL).pipe(
        map((body) => (Array.isArray(body) ? body.length : 0)),
        catchError(() => of(0)),
      ),
    }).subscribe(({ pending, invites }) => this.count.set(pending + invites));
  }
}
