import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WalletSummary } from '../wallet.model';
import { WalletsApi, toWalletEntry, toWalletSummary } from './wallets-api';

const summary = { type: 'OWNER', refId: 'u1', name: 'Maria', available: 10.5, pending: 2 };
const entry = {
  id: 'e1',
  kind: 'RENTAL_CREDIT',
  amount: 47.5,
  availableAt: '2026-11-16T10:00:00Z',
  released: false,
  rentalId: 'r1',
  createdAt: '2026-11-15T10:00:00Z',
};

describe('WalletsApi', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { api: TestBed.inject(WalletsApi), http: TestBed.inject(HttpTestingController) };
  }

  it('maps wallets and rejects malformed ones', () => {
    expect(toWalletSummary(summary).available).toBe(10.5);
    expect(() => toWalletSummary({ ...summary, type: 'OTHER' })).toThrow();
    expect(() => toWalletSummary({ ...summary, available: 'x' })).toThrow();
  });

  it('accepts a wallet without a name', () => {
    expect(toWalletSummary({ ...summary, name: null }).name).toBeNull();
  });

  it('maps entries and rejects malformed ones', () => {
    expect(toWalletEntry(entry).rentalId).toBe('r1');
    expect(toWalletEntry({ ...entry, rentalId: null }).rentalId).toBeNull();
    expect(() => toWalletEntry({ ...entry, kind: 'X' })).toThrow();
    expect(() => toWalletEntry({ ...entry, released: 'no' })).toThrow();
  });

  it('pages the statement using X-Total-Count', () => {
    const { api, http } = setup();
    const wallet = toWalletSummary(summary) satisfies WalletSummary;
    let total: number | undefined;
    api.entries(wallet, 1, 25).subscribe((page) => (total = page.total));
    const request = http.expectOne((r) => r.url === '/api/v1/wallets/entries');
    expect(request.request.params.get('type')).toBe('OWNER');
    expect(request.request.params.get('refId')).toBe('u1');
    expect(request.request.params.get('page')).toBe('1');
    request.flush([entry], { headers: { 'X-Total-Count': '40' } });
    expect(total).toBe(40);
    http.verify();
  });

  it('posts the withdrawal', () => {
    const { api, http } = setup();
    api.withdraw({ type: 'OWNER', refId: 'u1', amount: 5, pixKey: 'a@b.c' }).subscribe();
    const request = http.expectOne('/api/v1/wallets/withdrawals');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      type: 'OWNER',
      refId: 'u1',
      amount: 5,
      pixKey: 'a@b.c',
    });
    request.flush({});
    http.verify();
  });
});
