import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PaymentsApi, toPayment } from './payments-api';

const row = { id: 'p1', status: 'PENDING', method: 'PIX', amount: 55, pixCode: '000201' };

describe('PaymentsApi', () => {
  let api: PaymentsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PaymentsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a payment with the chosen method', () => {
    let payment: unknown;
    api
      .create({ rentalId: 'r1', method: 'CARD', cardLast4: '4242' })
      .subscribe((value) => (payment = value));
    const request = http.expectOne('/api/v1/payments');
    expect(request.request.body).toEqual({ rentalId: 'r1', method: 'CARD', cardLast4: '4242' });
    request.flush({ ...row, method: 'CARD', status: 'PAID' });
    expect(payment).toMatchObject({ method: 'CARD', status: 'PAID' });
  });

  it('finds the pending payment of a rental', () => {
    let payment: unknown = 'unset';
    api.pendingOf('r1').subscribe((value) => (payment = value));
    const request = http.expectOne((req) => req.url === '/api/v1/payments');
    expect(request.request.params.get('rentalId')).toBe('r1');
    expect(request.request.params.get('status')).toBe('PENDING');
    request.flush([row]);
    expect(payment).toMatchObject({ id: 'p1', pixCode: '000201' });
  });

  it('returns null when there is no pending payment', () => {
    let payment: unknown = 'unset';
    api.pendingOf('r1').subscribe((value) => (payment = value));
    http.expectOne((req) => req.url === '/api/v1/payments').flush([]);
    expect(payment).toBeNull();
  });

  it('cancels a pending payment', () => {
    api.cancel('p1').subscribe();
    const request = http.expectOne('/api/v1/payments/p1/cancel');
    expect(request.request.method).toBe('POST');
    request.flush({ ...row, status: 'CANCELED' });
  });

  it('rejects malformed payments', () => {
    expect(() => toPayment({ ...row, status: 'LOST' })).toThrow();
    expect(() => toPayment({ ...row, amount: 'x' })).toThrow();
  });
});
