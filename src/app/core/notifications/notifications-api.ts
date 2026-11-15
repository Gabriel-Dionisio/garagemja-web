import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { fields, textOrNull } from '../../shared/models/fields';
import { Page, toPage } from '../../shared/models/page';
import { AppNotification, NOTIFICATION_KINDS, NotificationKind } from './notification.model';

const URL = '/api/v1/me/notifications';

export function toNotification(value: unknown): AppNotification {
  const row = fields(value);
  const { id, kind, condominiumName, createdAt, read } = row;
  if (
    typeof id !== 'string' ||
    typeof kind !== 'string' ||
    !NOTIFICATION_KINDS.some((known) => known === kind) ||
    typeof condominiumName !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof read !== 'boolean'
  ) {
    throw new Error('Invalid notification');
  }
  return {
    id,
    kind: kind as NotificationKind,
    condominiumName,
    reason: textOrNull(row['reason']),
    createdAt,
    read,
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);

  list(page: number, size: number): Observable<Page<AppNotification>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<unknown>(URL, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid notification list');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(
          body.map(toNotification),
          page,
          size,
          Number.isInteger(total) ? total : undefined,
        );
      }),
    );
  }

  unreadCount(): Observable<number> {
    return this.http.get<unknown>(`${URL}/unread-count`).pipe(
      map((body) => {
        const count = Number(fields(body)['count']);
        if (!Number.isInteger(count) || count < 0) throw new Error('Invalid unread count');
        return count;
      }),
    );
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${URL}/read`, null).pipe(map(() => undefined));
  }
}
