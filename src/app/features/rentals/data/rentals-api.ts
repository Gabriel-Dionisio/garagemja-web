import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields } from '../../../shared/models/fields';
import { Page, toPage } from '../../../shared/models/page';
import { Rental, RentalStatus, isRentalStatus } from '../rental.model';

const MY_RENTALS_URL = '/api/v1/me/rentals';

export function toRental(value: unknown): Rental {
  const row = fields(value);
  const price = Number(row['price']);
  const { id, condominiumName, parkingSpotNumber, startDate, endDate, status } = row;
  if (
    typeof id !== 'string' ||
    typeof condominiumName !== 'string' ||
    typeof parkingSpotNumber !== 'string' ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    !isRentalStatus(status) ||
    !Number.isFinite(price)
  ) {
    throw new Error('Invalid rental');
  }
  return { id, condominiumName, parkingSpotNumber, startDate, endDate, price, status };
}

@Injectable({ providedIn: 'root' })
export class RentalsApi {
  private readonly http = inject(HttpClient);

  list(page: number, size: number, status: RentalStatus | null): Observable<Page<Rental>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<unknown>(MY_RENTALS_URL, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid rental list');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(body.map(toRental), page, size, Number.isInteger(total) ? total : undefined);
      }),
    );
  }
}
