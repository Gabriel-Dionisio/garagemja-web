import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { onlyDigits } from '../../../shared/forms/masks';
import { Profile, ProfileChanges } from '../profile.model';

const USERS_URL = '/api/v1/users';

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);

  get(id: string): Observable<Profile> {
    return this.http.get<unknown>(`${USERS_URL}/${id}`).pipe(map(toProfile));
  }

  update(id: string, changes: ProfileChanges): Observable<Profile> {
    return this.http.patch<unknown>(`${USERS_URL}/${id}`, changes).pipe(map(toProfile));
  }

  uploadPhoto(id: string, file: File): Observable<Profile> {
    const body = new FormData();
    body.append('file', file);
    return this.http.put<unknown>(`${USERS_URL}/${id}/photo`, body).pipe(map(toProfile));
  }

  removePhoto(id: string): Observable<Profile> {
    return this.http.delete<unknown>(`${USERS_URL}/${id}/photo`).pipe(map(toProfile));
  }
}

export function toProfile(value: unknown): Profile {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid profile');
  const data = Object.fromEntries(Object.entries(value));
  if (
    typeof data['id'] !== 'string' ||
    typeof data['name'] !== 'string' ||
    typeof data['email'] !== 'string'
  ) {
    throw new Error('Invalid profile');
  }
  return {
    id: data['id'],
    name: data['name'],
    email: data['email'],
    phone: onlyDigits(optionalText(data['phone'])),
    cpf: onlyDigits(optionalText(data['cpf'])),
    photoUrl: typeof data['photoUrl'] === 'string' ? data['photoUrl'] : null,
  };
}

function optionalText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
