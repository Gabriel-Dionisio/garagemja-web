import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Page, toPage } from '../../../shared/models/page';
import { User, UserChanges, AdminDraft, UserFilter } from '../user.model';
import { toUser } from './user.mapper';

const USERS_URL = '/api/v1/users';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);

  list(filter: UserFilter, page: number, size: number): Observable<Page<User>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filter.email) params = params.set('email', filter.email);
    if (filter.cpf) params = params.set('cpf', filter.cpf);
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<unknown>(USERS_URL, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid user list');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(body.map(toUser), page, size, Number.isInteger(total) ? total : undefined);
      }),
    );
  }

  get(id: string): Observable<User> {
    return this.http.get<unknown>(`${USERS_URL}/${id}`).pipe(map(toUser));
  }

  create(draft: AdminDraft): Observable<User> {
    return this.http.post<unknown>(USERS_URL, draft).pipe(map(toUser));
  }

  update(id: string, changes: UserChanges): Observable<User> {
    return this.http.patch<unknown>(`${USERS_URL}/${id}`, changes).pipe(map(toUser));
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${USERS_URL}/${id}`);
  }
}
