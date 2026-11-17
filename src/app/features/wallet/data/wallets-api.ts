import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields, textOrNull } from '../../../shared/models/fields';
import { Page, toResponsePage } from '../../../shared/models/page';
import { ChartPeriod } from '../../../shared/ui/chart/period';
import {
  ENTRY_KINDS,
  WALLET_TYPES,
  WalletEntry,
  WalletEntryKind,
  WalletFlowPoint,
  WalletSummary,
  WalletType,
  WithdrawalRequest,
} from '../wallet.model';

const WALLETS_URL = '/api/v1/wallets';
const FLOW_URL = '/api/v1/stats/me/wallet';
const START = /^\d{4}-\d{2}$/;

export function toWalletSummary(value: unknown): WalletSummary {
  const row = fields(value, 'wallet');
  const { type, refId, name } = row;
  const available = Number(row['available']);
  const pending = Number(row['pending']);
  if (
    typeof type !== 'string' ||
    !WALLET_TYPES.includes(type as WalletType) ||
    typeof refId !== 'string' ||
    (name !== null && typeof name !== 'string') ||
    !Number.isFinite(available) ||
    !Number.isFinite(pending)
  ) {
    throw new Error('Invalid wallet');
  }
  return { type: type as WalletType, refId, name: name ?? null, available, pending };
}

export function toWalletEntry(value: unknown): WalletEntry {
  const row = fields(value, 'wallet entry');
  const { id, kind, availableAt, released, createdAt } = row;
  const amount = Number(row['amount']);
  if (
    typeof id !== 'string' ||
    typeof kind !== 'string' ||
    !ENTRY_KINDS.includes(kind as WalletEntryKind) ||
    typeof availableAt !== 'string' ||
    typeof released !== 'boolean' ||
    typeof createdAt !== 'string' ||
    !Number.isFinite(amount)
  ) {
    throw new Error('Invalid wallet entry');
  }
  return {
    id,
    kind: kind as WalletEntryKind,
    amount,
    availableAt,
    released,
    rentalId: textOrNull(row['rentalId']),
    createdAt,
  };
}

export function toWalletFlow(value: unknown): WalletFlowPoint[] {
  const points = fields(value, 'wallet flow')['points'];
  if (!Array.isArray(points)) throw new Error('Invalid wallet flow');
  return points.map((item) => {
    const row = fields(item, 'wallet flow point');
    const start = row['start'];
    const credits = Number(row['credits']);
    const debits = Number(row['debits']);
    if (
      typeof start !== 'string' ||
      !START.test(start) ||
      !Number.isFinite(credits) ||
      !Number.isFinite(debits)
    ) {
      throw new Error('Invalid wallet flow');
    }
    return { start, credits, debits };
  });
}

@Injectable({ providedIn: 'root' })
export class WalletsApi {
  private readonly http = inject(HttpClient);

  list(): Observable<WalletSummary[]> {
    return this.http.get<unknown>(WALLETS_URL).pipe(
      map((body) => {
        if (!Array.isArray(body)) throw new Error('Invalid wallet list');
        return body.map(toWalletSummary);
      }),
    );
  }

  entries(wallet: WalletSummary, page: number, size: number): Observable<Page<WalletEntry>> {
    const params = new HttpParams()
      .set('type', wallet.type)
      .set('refId', wallet.refId)
      .set('page', page)
      .set('size', size);
    return this.http.get<unknown>(`${WALLETS_URL}/entries`, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid wallet entries');
        return toResponsePage(response, body.map(toWalletEntry), page, size);
      }),
    );
  }

  flow(wallet: WalletSummary, period: ChartPeriod): Observable<WalletFlowPoint[]> {
    const params = new HttpParams()
      .set('type', wallet.type)
      .set('refId', wallet.refId)
      .set('period', period);
    return this.http.get<unknown>(FLOW_URL, { params }).pipe(map(toWalletFlow));
  }

  withdraw(request: WithdrawalRequest, idempotencyKey: string): Observable<void> {
    return this.http
      .post<unknown>(`${WALLETS_URL}/withdrawals`, request, {
        headers: { 'Idempotency-Key': idempotencyKey },
      })
      .pipe(map(() => undefined));
  }
}
