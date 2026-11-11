import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

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
}
