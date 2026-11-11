import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ManagedCondominium, isManagedStatus } from '../managed-condominium.model';

@Injectable({ providedIn: 'root' })
export class ManagedCondominiumsApi {
  private readonly http = inject(HttpClient);

  list(size: number): Observable<ManagedCondominium[]> {
    const params = new HttpParams().set('page', 0).set('size', size);
    return this.http.get<unknown>('/api/v1/me/managed-condominiums', { params }).pipe(
      map((body) => {
        if (!Array.isArray(body)) throw new Error('Invalid managed condominium list');
        return body.map(toManagedCondominium);
      }),
    );
  }

  becomeResident(id: string): Observable<void> {
    return this.http.post<void>(`/api/v1/condominiums/${id}/managers/me/residency`, {});
  }
}

function toManagedCondominium(value: unknown): ManagedCondominium {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid managed condominium');
  const { id, name, status, pendingResidents, residents, parkingSpots, activeRentals, resides } =
    Object.fromEntries(Object.entries(value));
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    !isManagedStatus(status) ||
    typeof pendingResidents !== 'number' ||
    typeof residents !== 'number' ||
    typeof parkingSpots !== 'number' ||
    typeof activeRentals !== 'number' ||
    typeof resides !== 'boolean'
  ) {
    throw new Error('Invalid managed condominium');
  }
  return { id, name, status, pendingResidents, residents, parkingSpots, activeRentals, resides };
}
