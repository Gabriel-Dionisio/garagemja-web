import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields } from '../../../shared/models/fields';
import { ChartPeriod } from '../../../shared/ui/chart/period';

export interface MonthlyPoint {
  month: string;
  count: number;
}

export interface AdminMonthlyStats {
  users: MonthlyPoint[];
  condominiums: MonthlyPoint[];
}

export interface ManagerMonthlyStats {
  residentRequests: MonthlyPoint[];
  rentals: MonthlyPoint[];
}

export interface RentalPeriodPoint {
  start: string;
  received: number;
  made: number;
}

const STATS_URL = '/api/v1/stats';

function toPoints(value: unknown): MonthlyPoint[] {
  if (!Array.isArray(value)) throw new Error('Invalid monthly stats');
  return value.map((item) => {
    const { month, count } = item as Record<string, unknown>;
    if (typeof month !== 'string' || typeof count !== 'number') {
      throw new Error('Invalid monthly stats');
    }
    return { month, count };
  });
}

const START = /^\d{4}-\d{2}$/;

export function toRentalPoints(value: unknown): RentalPeriodPoint[] {
  const points = fields(value, 'rental stats')['points'];
  if (!Array.isArray(points)) throw new Error('Invalid rental stats');
  return points.map((item) => {
    const { start, received, made } = fields(item, 'rental stats point');
    if (
      typeof start !== 'string' ||
      !START.test(start) ||
      typeof received !== 'number' ||
      typeof made !== 'number'
    ) {
      throw new Error('Invalid rental stats');
    }
    return { start, received, made };
  });
}

@Injectable({ providedIn: 'root' })
export class StatsApi {
  private readonly http = inject(HttpClient);

  adminMonthly(): Observable<AdminMonthlyStats> {
    return this.http.get<Record<string, unknown>>(`${STATS_URL}/admin/monthly`).pipe(
      map((body) => ({
        users: toPoints(body['users']),
        condominiums: toPoints(body['condominiums']),
      })),
    );
  }

  managerMonthly(): Observable<ManagerMonthlyStats> {
    return this.http.get<Record<string, unknown>>(`${STATS_URL}/manager/monthly`).pipe(
      map((body) => ({
        residentRequests: toPoints(body['residentRequests']),
        rentals: toPoints(body['rentals']),
      })),
    );
  }

  myRentals(period: ChartPeriod): Observable<RentalPeriodPoint[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<unknown>(`${STATS_URL}/me/rentals`, { params }).pipe(map(toRentalPoints));
  }
}
