import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields, textOrNull } from '../models/fields';
import { Page, toResponsePage } from '../models/page';
import { OwnedRental, RentalStatus } from './owned-rental.model';

const OWNED_RENTALS_URL = '/api/v1/me/owned-rentals';
const RENTALS_URL = '/api/v1/rentals';
export const RENTAL_STATUSES: readonly string[] = [
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'REFUSED',
  'CANCELED',
  'FINISHED',
  'EXPIRED',
];

function toOwnedRental(value: unknown): OwnedRental {
  const row = fields(value);
  const price = Number(row['price']);
  const total = Number(row['total']);
  const ownerAmount = Number(row['ownerAmount']);
  const { id, condominiumId, condominiumName, parkingSpotId, parkingSpotNumber } = row;
  const { startDate, endDate, status, renterName, vehiclePlate } = row;
  if (
    typeof id !== 'string' ||
    typeof condominiumId !== 'string' ||
    typeof condominiumName !== 'string' ||
    typeof parkingSpotId !== 'string' ||
    typeof parkingSpotNumber !== 'string' ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    typeof status !== 'string' ||
    typeof renterName !== 'string' ||
    typeof vehiclePlate !== 'string' ||
    !RENTAL_STATUSES.includes(status) ||
    !Number.isFinite(price) ||
    !Number.isFinite(total) ||
    !Number.isFinite(ownerAmount)
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
    startHour: typeof row['startHour'] === 'number' ? row['startHour'] : null,
    endHour: typeof row['endHour'] === 'number' ? row['endHour'] : null,
    price,
    total,
    ownerAmount,
    status: status as RentalStatus,
    cancelReason: textOrNull(row['cancelReason']),
    renterUserId: textOrNull(row['renterUserId']),
    renterName,
    renterPhotoUrl: textOrNull(row['renterPhotoUrl']),
    vehiclePlate,
    vehicleBrand: textOrNull(row['vehicleBrand']),
    vehicleModel: textOrNull(row['vehicleModel']),
  };
}

@Injectable({ providedIn: 'root' })
export class OwnedRentalsApi {
  private readonly http = inject(HttpClient);

  list(
    page: number,
    size: number,
    status: RentalStatus | null,
    search = '',
  ): Observable<Page<OwnedRental>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    if (search) params = params.set('q', search);
    return this.http.get<unknown>(OWNED_RENTALS_URL, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid rental list');
        return toResponsePage(response, body.map(toOwnedRental), page, size);
      }),
    );
  }

  approve(id: string): Observable<void> {
    return this.http
      .patch<unknown>(`${RENTALS_URL}/${id}`, { status: 'APPROVED' })
      .pipe(map(() => undefined));
  }

  refuse(id: string, reason: string): Observable<void> {
    return this.http
      .patch<unknown>(`${RENTALS_URL}/${id}`, { status: 'REFUSED', cancelReason: reason })
      .pipe(map(() => undefined));
  }
}
