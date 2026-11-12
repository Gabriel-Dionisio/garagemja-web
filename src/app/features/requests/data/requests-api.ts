import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OwnedRentalsApi } from '../../dashboard/data/owned-rentals-api';
import { OwnedRental } from '../../dashboard/owned-rental.model';
import { Page } from '../../../shared/models/page';
import { RequestDecision, RequestStatus } from '../request.model';

const RENTALS_URL = '/api/v1/rentals';

@Injectable({ providedIn: 'root' })
export class RequestsApi {
  private readonly http = inject(HttpClient);
  private readonly owned = inject(OwnedRentalsApi);

  list(page: number, size: number, status: RequestStatus): Observable<Page<OwnedRental>> {
    return this.owned.list(page, size, status);
  }

  decide(id: string, decision: RequestDecision): Observable<void> {
    return this.http
      .patch<unknown>(`${RENTALS_URL}/${id}`, { status: decision })
      .pipe(map(() => undefined));
  }
}
