import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields } from '../../../shared/models/fields';
import { Page, toPage } from '../../../shared/models/page';
import { OwnedRental, OwnedRentalSummary, RentalStatus } from '../owned-rental.model';

const OWNED_RENTALS_URL = '/api/v1/me/owned-rentals';
const RENTED_URL = '/api/v1/me/rentals';
export const RENTAL_STATUSES: readonly string[] = [
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'REFUSED',
  'CANCELED',
  'FINISHED',
];

function toOwnedRental(value: unknown): OwnedRental {
  const row = fields(value);
  const price = Number(row['price']);
  const { id, condominiumId, condominiumName, parkingSpotId, parkingSpotNumber } = row;
  const { startDate, endDate, status } = row;
  if (
    typeof id !== 'string' ||
    typeof condominiumId !== 'string' ||
    typeof condominiumName !== 'string' ||
    typeof parkingSpotId !== 'string' ||
    typeof parkingSpotNumber !== 'string' ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    typeof status !== 'string' ||
    !RENTAL_STATUSES.includes(status) ||
    !Number.isFinite(price)
  ) {
    throw new Error('Invalid rental');
  }
  return {
    id,
    condominiumId,
    condominiumName,
    parkingSpotId,
    parkingSpotNumber,
    startDate,
    endDate,
    price,
    status: status as RentalStatus,
  };
}

function toSummary(value: unknown): OwnedRentalSummary {
  const row = fields(value);
  const summary = {
    spots: Number(row['spots']),
    pending: Number(row['pending']),
    active: Number(row['active']),
    upcoming: Number(row['upcoming']),
    monthEarnings: Number(row['monthEarnings']),
  };
  if (Object.values(summary).some((item) => !Number.isFinite(item))) {
    throw new Error('Invalid rental summary');
  }
  return summary;
}

@Injectable({ providedIn: 'root' })
export class OwnedRentalsApi {
  private readonly http = inject(HttpClient);

  summary(): Observable<OwnedRentalSummary> {
    return this.http.get<unknown>(`${OWNED_RENTALS_URL}/summary`).pipe(map(toSummary));
  }

  list(page: number, size: number, status: RentalStatus | null): Observable<Page<OwnedRental>> {
    return this.page(OWNED_RENTALS_URL, page, size, status);
  }

  rented(page: number, size: number, status: RentalStatus | null): Observable<Page<OwnedRental>> {
    return this.page(RENTED_URL, page, size, status);
  }

  private page(
    url: string,
    page: number,
    size: number,
    status: RentalStatus | null,
  ): Observable<Page<OwnedRental>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<unknown>(url, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid rental list');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(
          body.map(toOwnedRental),
          page,
          size,
          Number.isInteger(total) ? total : undefined,
        );
      }),
    );
  }
}
