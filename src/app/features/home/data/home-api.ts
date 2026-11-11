import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { FeaturedCondominium, HomeSpots } from '../home.model';

function toFeatured(value: unknown): FeaturedCondominium {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid featured condominium');
  const { id, name, availableVagas, pricePerHour, imageUrl } = Object.fromEntries(
    Object.entries(value),
  );
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof availableVagas !== 'number' ||
    !Number.isInteger(availableVagas) ||
    (pricePerHour != null && typeof pricePerHour !== 'number') ||
    (imageUrl != null && typeof imageUrl !== 'string')
  ) {
    throw new Error('Invalid featured condominium');
  }
  return {
    id,
    name,
    availableVagas,
    pricePerHour: pricePerHour ?? null,
    imageUrl: imageUrl ?? null,
  };
}

@Injectable({ providedIn: 'root' })
export class HomeApi {
  private readonly http = inject(HttpClient);

  loadMine(): Observable<HomeSpots> {
    const params = new HttpParams().set('page', 0).set('size', 1);
    return forkJoin({
      residencies: this.http
        .get<unknown>('/api/v1/me/residencies', { params, observe: 'response' })
        .pipe(
          map((response) => {
            if (!Array.isArray(response.body)) throw new Error('Invalid residency list');
            const total = Number(response.headers.get('X-Total-Count'));
            return Number.isInteger(total) ? total : response.body.length;
          }),
        ),
      condominiums: this.http.get<unknown>('/api/v1/me/featured-condominiums').pipe(
        map((body) => {
          if (!Array.isArray(body)) throw new Error('Invalid featured condominium list');
          return body.map(toFeatured);
        }),
      ),
    });
  }
}
