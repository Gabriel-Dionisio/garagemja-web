import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LookupOption } from '../ui/lookup-field/lookup-field';

const LOOKUP_SIZE = 5;

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toOption(value: unknown, detailKey: string): LookupOption {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid lookup item');
  const item = Object.fromEntries(Object.entries(value));
  const { id, name } = item;
  if (typeof id !== 'string' || typeof name !== 'string') throw new Error('Invalid lookup item');
  return { id, label: name, detail: text(item[detailKey]) };
}

function toOptions(body: unknown, detailKey: string): LookupOption[] {
  if (!Array.isArray(body)) throw new Error('Invalid lookup list');
  return body.map((item) => toOption(item, detailKey));
}

@Injectable({ providedIn: 'root' })
export class EntityLookup {
  private readonly http = inject(HttpClient);

  searchUsers(term: string): Observable<LookupOption[]> {
    const params = new HttpParams().set('email', term).set('page', 0).set('size', LOOKUP_SIZE);
    return this.http
      .get<unknown>('/api/v1/users', { params })
      .pipe(map((body) => toOptions(body, 'email')));
  }

  searchCondominiums(term: string): Observable<LookupOption[]> {
    const params = new HttpParams().set('name', term).set('page', 0).set('size', LOOKUP_SIZE);
    return this.http
      .get<unknown>('/api/v1/condominiums', { params })
      .pipe(map((body) => toOptions(body, 'city')));
  }

  user(id: string): Observable<LookupOption> {
    return this.http.get<unknown>(`/api/v1/users/${id}`).pipe(map((body) => toOption(body, 'email')));
  }

  condominium(id: string): Observable<LookupOption> {
    return this.http
      .get<unknown>(`/api/v1/condominiums/${id}`)
      .pipe(map((body) => toOption(body, 'city')));
  }
}
