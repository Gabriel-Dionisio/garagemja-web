import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeApi {
  private readonly http = inject(HttpClient);

  residencyCount(): Observable<number> {
    const params = new HttpParams().set('page', 0).set('size', 1);
    return this.http.get<unknown>('/api/v1/me/residencies', { params, observe: 'response' }).pipe(
      map((response) => {
        if (!Array.isArray(response.body)) throw new Error('Invalid residency list');
        const header = response.headers.get('X-Total-Count');
        return header === null ? response.body.length : Number(header);
      }),
    );
  }
}
