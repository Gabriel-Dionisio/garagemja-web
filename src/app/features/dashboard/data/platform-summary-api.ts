import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface UsersTotals {
  total: number;
  active: number;
  blocked: number;
}

export interface CondominiumsTotals extends UsersTotals {
  pending: number;
}

@Injectable({ providedIn: 'root' })
export class PlatformSummaryApi {
  private readonly http = inject(HttpClient);

  condominiums(): Observable<CondominiumsTotals> {
    return this.http.get<unknown>('/api/v1/condominiums/summary').pipe(
      map((body) => {
        const { total, active, blocked } = toUsersTotals(body);
        const { pending } = Object.fromEntries(Object.entries(body as object));
        if (!Number.isInteger(pending)) throw new Error('Invalid summary');
        return { total, active, blocked, pending: Number(pending) };
      }),
    );
  }

  users(): Observable<UsersTotals> {
    return this.http.get<unknown>('/api/v1/users/summary').pipe(map(toUsersTotals));
  }
}

function toUsersTotals(value: unknown): UsersTotals {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid summary');
  const { total, active, blocked } = Object.fromEntries(Object.entries(value));
  if (!Number.isInteger(total) || !Number.isInteger(active) || !Number.isInteger(blocked)) {
    throw new Error('Invalid summary');
  }
  return { total, active, blocked };
}
