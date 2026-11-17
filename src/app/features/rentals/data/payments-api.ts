import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields, textOrNull } from '../../../shared/models/fields';
import { Payment, PaymentMethod, PaymentRequest, PaymentStatus } from '../payment.model';

const PAYMENTS_URL = '/api/v1/payments';
const STATUSES: readonly string[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELED'];
const METHODS: readonly string[] = ['PIX', 'CARD'];

export function toPayment(value: unknown): Payment {
  const row = fields(value);
  const { id, status, method } = row;
  const amount = Number(row['amount']);
  if (
    typeof id !== 'string' ||
    typeof status !== 'string' ||
    typeof method !== 'string' ||
    !STATUSES.includes(status) ||
    !METHODS.includes(method) ||
    !Number.isFinite(amount)
  ) {
    throw new Error('Invalid payment');
  }
  return {
    id,
    status: status as PaymentStatus,
    method: method as PaymentMethod,
    amount,
    pixCode: textOrNull(row['pixCode']),
    failureReason: textOrNull(row['failureReason']),
  };
}

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly http = inject(HttpClient);

  create(request: PaymentRequest): Observable<Payment> {
    return this.http.post<unknown>(PAYMENTS_URL, request).pipe(map(toPayment));
  }

  get(id: string): Observable<Payment> {
    return this.http.get<unknown>(`${PAYMENTS_URL}/${id}`).pipe(map(toPayment));
  }

  pendingOf(rentalId: string): Observable<Payment | null> {
    const params = new HttpParams()
      .set('rentalId', rentalId)
      .set('status', 'PENDING')
      .set('size', 1);
    return this.http.get<unknown>(PAYMENTS_URL, { params }).pipe(
      map((body) => {
        if (!Array.isArray(body)) throw new Error('Invalid payment list');
        return body.length > 0 ? toPayment(body[0]) : null;
      }),
    );
  }

  cancel(id: string): Observable<Payment> {
    return this.http.post<unknown>(`${PAYMENTS_URL}/${id}/cancel`, {}).pipe(map(toPayment));
  }
}
