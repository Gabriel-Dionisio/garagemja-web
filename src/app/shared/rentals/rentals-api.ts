import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields } from '../models/fields';
import { Page, toResponsePage } from '../models/page';
import { CancellationPreview, Rental, RentalStatus, isRentalStatus } from './rental.model';

const MY_RENTALS_URL = '/api/v1/me/rentals';
const RENTALS_URL = '/api/v1/rentals';

export function toRental(value: unknown): Rental {
  const row = fields(value);
  const price = Number(row['price']);
  const total = Number(row['total']);
  const payable = Number(row['payable']);
  const { id, condominiumName, parkingSpotNumber, startDate, endDate, status } = row;
  if (
    typeof id !== 'string' ||
    typeof condominiumName !== 'string' ||
    typeof parkingSpotNumber !== 'string' ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    !isRentalStatus(status) ||
    !Number.isFinite(price) ||
    !Number.isFinite(total) ||
    !Number.isFinite(payable)
  ) {
    throw new Error('Invalid rental');
  }
  return {
    id,
    condominiumName,
    parkingSpotNumber,
    startDate,
    endDate,
    startHour: typeof row['startHour'] === 'number' ? row['startHour'] : null,
    endHour: typeof row['endHour'] === 'number' ? row['endHour'] : null,
    price,
    total,
    payable,
    paid: row['paid'] === true,
    paymentPending: row['paymentPending'] === true,
    status,
    cancelReason: typeof row['cancelReason'] === 'string' ? row['cancelReason'] : null,
  };
}

export interface RentalRequest {
  parkingSpotId: string;
  renterResidentId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  startHour: number | null;
  endHour: number | null;
}

@Injectable({ providedIn: 'root' })
export class RentalsApi {
  private readonly http = inject(HttpClient);

  create(request: RentalRequest): Observable<void> {
    return this.http.post<unknown>(RENTALS_URL, request).pipe(map(() => undefined));
  }

  cancel(id: string): Observable<void> {
    return this.http
      .patch<unknown>(`${RENTALS_URL}/${id}`, { status: 'CANCELED' })
      .pipe(map(() => undefined));
  }

  cancellationPreview(id: string): Observable<CancellationPreview> {
    return this.http.get<unknown>(`${RENTALS_URL}/${id}/cancellation-preview`).pipe(
      map((value) => {
        const row = fields(value);
        const refundAmount = Number(row['refundAmount']);
        const penalty = Number(row['penalty']);
        if (!Number.isFinite(refundAmount) || !Number.isFinite(penalty)) {
          throw new Error('Invalid cancellation preview');
        }
        return { refundAmount, penalty, late: row['late'] === true };
      }),
    );
  }

  list(
    page: number,
    size: number,
    status: RentalStatus | null,
    search = '',
  ): Observable<Page<Rental>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    if (search) params = params.set('q', search);
    return this.http.get<unknown>(MY_RENTALS_URL, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid rental list');
        return toResponsePage(response, body.map(toRental), page, size);
      }),
    );
  }
}
