import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Page, toPage } from '../../../shared/models/page';
import { AuditLog, AuditLogFilter } from '../audit-log.model';
import { toAuditLog } from './audit-log.mapper';

const BASE_URL = '/api/v1';

@Injectable({ providedIn: 'root' })
export class AuditLogsApi {
  private readonly http = inject(HttpClient);

  list(
    filter: AuditLogFilter,
    page: number,
    size: number,
    condominiumId?: string,
  ): Observable<Page<AuditLog>> {
    const params = this.params(filter).set('page', page).set('size', size);
    return this.http.get<unknown>(this.url(condominiumId), { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid audit log list');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(
          body.map(toAuditLog),
          page,
          size,
          Number.isInteger(total) ? total : undefined,
        );
      }),
    );
  }

  exportUrl(filter: AuditLogFilter, condominiumId?: string): string {
    const query = this.params(filter).toString();
    return `${this.url(condominiumId)}/export${query ? `?${query}` : ''}`;
  }

  private url(condominiumId?: string): string {
    return condominiumId
      ? `${BASE_URL}/condominiums/${condominiumId}/audit-logs`
      : `${BASE_URL}/audit-logs`;
  }

  private params(filter: AuditLogFilter): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filter)) {
      if (value) params = params.set(key, String(value));
    }
    return params;
  }
}
