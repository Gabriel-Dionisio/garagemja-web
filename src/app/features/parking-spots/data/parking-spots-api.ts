import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields } from '../../../shared/models/fields';
import { Page, toPage } from '../../../shared/models/page';
import { LookupOption } from '../../../shared/ui/lookup-field/lookup-field';
import { VacancyCriteria } from '../../search-vacancies/search-vacancies.model';
import {
  ParkingSpot,
  ParkingSpotCondominium,
  ParkingSpotFilter,
  ParkingSpotImage,
  ParkingSpotInput,
  ParkingSpotResidency,
  ParkingSpotStatus,
  SpotAvailability,
  SpotAvailabilityInput,
  SpotRules,
} from '../parking-spot.model';
import {
  toParkingSpot,
  toParkingSpotCondominium,
  toParkingSpotImages,
  toParkingSpotResidency,
  toSpotAvailability,
  toSpotRules,
} from './parking-spot.mapper';

const SPOTS_URL = '/api/v1/parking-spots';
const CONDOMINIUMS_URL = '/api/v1/condominiums';
const AVAILABILITIES_URL = '/api/v1/spot-availabilities';

@Injectable({ providedIn: 'root' })
export class ParkingSpotsApi {
  private readonly http = inject(HttpClient);

  condominium(id: string): Observable<ParkingSpotCondominium> {
    return this.http.get<unknown>(`${CONDOMINIUMS_URL}/${id}`).pipe(map(toParkingSpotCondominium));
  }

  list(
    condominiumId: string | null,
    filter: ParkingSpotFilter,
    page: number,
    size: number,
  ): Observable<Page<ParkingSpot>> {
    let params = new HttpParams();
    if (condominiumId) params = params.set('condominiumId', condominiumId);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.size) params = params.set('spotSize', filter.size);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.mine) params = params.set('mine', true);
    return this.page(params, page, size);
  }

  search(criteria: VacancyCriteria, page: number, size: number): Observable<Page<ParkingSpot>> {
    let params = new HttpParams().set('available', true).set('sort', criteria.sort);
    if (criteria.search) params = params.set('search', criteria.search);
    if (criteria.size) params = params.set('spotSize', criteria.size);
    if (criteria.from) params = params.set('from', criteria.from);
    if (criteria.to) params = params.set('to', criteria.to);
    if (criteria.hourly) params = params.set('hourly', true);
    if (criteria.minPrice !== null) params = params.set('minPrice', criteria.minPrice);
    if (criteria.maxPrice !== null) params = params.set('maxPrice', criteria.maxPrice);
    return this.page(params, page, size);
  }

  private page(params: HttpParams, page: number, size: number): Observable<Page<ParkingSpot>> {
    return this.http
      .get<unknown>(SPOTS_URL, {
        params: params.set('page', page).set('size', size),
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (!Array.isArray(response.body)) throw new Error('Invalid parking spot list');
          const total = Number(response.headers.get('X-Total-Count'));
          return toPage(
            response.body.map(toParkingSpot),
            page,
            size,
            Number.isInteger(total) ? total : undefined,
          );
        }),
      );
  }

  residencies(): Observable<ParkingSpotResidency[]> {
    const params = new HttpParams().set('page', 0).set('size', 100);
    return this.http.get<unknown>('/api/v1/me/residencies', { params }).pipe(
      map((body) => {
        if (!Array.isArray(body)) throw new Error('Invalid residency list');
        return body.map(toParkingSpotResidency).filter((residency) => residency.approved);
      }),
    );
  }

  rules(condominiumId: string): Observable<SpotRules> {
    return this.http
      .get<unknown>(`${CONDOMINIUMS_URL}/${condominiumId}/rules`)
      .pipe(map(toSpotRules));
  }

  availabilities(spotId: string): Observable<SpotAvailability[]> {
    const params = new HttpParams().set('parkingSpotId', spotId);
    return this.http.get<unknown>(AVAILABILITIES_URL, { params }).pipe(
      map((body) => {
        if (!Array.isArray(body)) throw new Error('Invalid availability list');
        return body.map(toSpotAvailability).sort((a, b) => a.startDate.localeCompare(b.startDate));
      }),
    );
  }

  createAvailability(spotId: string, input: SpotAvailabilityInput): Observable<SpotAvailability> {
    return this.http
      .post<unknown>(AVAILABILITIES_URL, { parkingSpotId: spotId, ...input })
      .pipe(map(toSpotAvailability));
  }

  updateAvailability(
    id: string,
    input: Partial<SpotAvailabilityInput> & {
      active?: boolean;
      clearHourlyPrice?: boolean;
      clearDailyPrice?: boolean;
    },
  ): Observable<SpotAvailability> {
    return this.http
      .patch<unknown>(`${AVAILABILITIES_URL}/${id}`, input)
      .pipe(map(toSpotAvailability));
  }

  removeAvailability(id: string): Observable<void> {
    return this.http.delete<void>(`${AVAILABILITIES_URL}/${id}`);
  }

  owners(condominiumId: string, term: string): Observable<LookupOption[]> {
    const params = new HttpParams().set('status', 'APPROVED').set('q', term).set('size', 8);
    return this.http
      .get<unknown>(`${CONDOMINIUMS_URL}/${condominiumId}/residents`, { params })
      .pipe(
        map((body) => {
          if (!Array.isArray(body)) throw new Error('Invalid resident list');
          return body.map((item) => {
            const { id, name, block, unit } = fields(item, 'resident');
            if (typeof id !== 'string' || typeof name !== 'string') {
              throw new Error('Invalid resident');
            }
            const place = [block, unit].filter((part) => typeof part === 'string' && part);
            return { id, label: name, detail: place.join(' / ') };
          });
        }),
      );
  }

  get(id: string): Observable<ParkingSpot> {
    return this.http.get<unknown>(`${SPOTS_URL}/${id}`).pipe(map(toParkingSpot));
  }

  create(condominiumId: string, input: ParkingSpotInput): Observable<ParkingSpot> {
    return this.http.post<unknown>(SPOTS_URL, { condominiumId, ...input }).pipe(map(toParkingSpot));
  }

  update(id: string, input: Partial<ParkingSpotInput>): Observable<ParkingSpot> {
    return this.http.patch<unknown>(`${SPOTS_URL}/${id}`, input).pipe(map(toParkingSpot));
  }

  setStatus(id: string, status: ParkingSpotStatus, reason?: string): Observable<ParkingSpot> {
    return this.http
      .patch<unknown>(`${SPOTS_URL}/${id}`, { status, statusReason: reason })
      .pipe(map(toParkingSpot));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${SPOTS_URL}/${id}`);
  }

  images(id: string): Observable<ParkingSpotImage[]> {
    return this.http.get<unknown>(`${SPOTS_URL}/${id}/images`).pipe(map(toParkingSpotImages));
  }

  addImage(id: string, file: File): Observable<ParkingSpotImage[]> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<unknown>(`${SPOTS_URL}/${id}/images`, body)
      .pipe(map(toParkingSpotImages));
  }

  removeImage(id: string, imageId: string): Observable<ParkingSpotImage[]> {
    return this.http
      .delete<unknown>(`${SPOTS_URL}/${id}/images/${imageId}`)
      .pipe(map(toParkingSpotImages));
  }
}
