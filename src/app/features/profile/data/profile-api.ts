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
}

export function toProfile(value: unknown): Profile {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid profile');
  const data = Object.fromEntries(Object.entries(value));
  if (
    typeof data['id'] !== 'string' ||
    typeof data['name'] !== 'string' ||
    typeof data['email'] !== 'string' ||
    typeof data['phone'] !== 'string'
  ) {
    throw new Error('Invalid profile');
  }
  return {
    id: data['id'],
    name: data['name'],
    email: data['email'],
    phone: onlyDigits(data['phone']),
  };
}
