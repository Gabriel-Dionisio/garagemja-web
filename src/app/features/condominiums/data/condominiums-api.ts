import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, tap, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth-service';
import { Page, toPage } from '../../../shared/models/page';
import {
  Condominium,
  CondominiumChanges,
  CondominiumCounts,
  CondominiumImage,
  CondominiumLookup,
  CondominiumRules,
  CondominiumFilter,
  JoinPreview,
  JoinRequest,
  ResidentMember,
  ResidentStatus,
  CondominiumDraft,
  CondominiumStatus,
  Manager,
  ManagedCondominium,
  ManagerInvite,
  ManagerTransfer,
} from '../condominium.model';
import {
  toCondominium,
  toCondominiumCounts,
  toCondominiumImages,
  toCondominiumLookup,
  toCondominiumRules,
  toManagedCondominium,
} from './condominium.mapper';
import { toList, toManager, toManagerInvite } from './manager.mapper';
import { toJoinCode, toJoinPreview, toResidentMember } from './resident.mapper';

const CONDOMINIUMS_URL = '/api/v1/condominiums';
const JOINS_URL = '/api/v1/joins';
const RESIDENTS_URL = '/api/v1/residents';
const MY_MANAGED_URL = '/api/v1/me/managed-condominiums';
const MY_INVITES_URL = '/api/v1/me/manager-invites';

@Injectable({ providedIn: 'root' })
export class CondominiumsApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  list(filter: CondominiumFilter, page: number, size: number): Observable<Page<Condominium>> {
    let params = new HttpParams().set('page', page).set('size', size);
    for (const [key, value] of Object.entries(filter)) {
      if (value) params = params.set(key, String(value));
    }
    return this.http.get<unknown>(CONDOMINIUMS_URL, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid condominium list');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(
          body.map(toCondominium),
          page,
          size,
          Number.isInteger(total) ? total : undefined,
        );
      }),
    );
  }

  get(id: string): Observable<Condominium> {
    return this.http.get<unknown>(`${CONDOMINIUMS_URL}/${id}`).pipe(map(toCondominium));
  }

  findByCnpj(cnpj: string): Observable<Condominium | null> {
    return this.http.get<unknown>(`${CONDOMINIUMS_URL}/cnpj/${cnpj}`).pipe(
      map(toCondominium),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
    );
  }

  create(draft: CondominiumDraft): Observable<Condominium> {
    return this.http.post<unknown>(CONDOMINIUMS_URL, draft).pipe(map(toCondominium));
  }

  update(id: string, changes: CondominiumChanges): Observable<Condominium> {
    return this.http.patch<unknown>(`${CONDOMINIUMS_URL}/${id}`, changes).pipe(map(toCondominium));
  }

  counts(id: string): Observable<CondominiumCounts> {
    return this.http
      .get<unknown>(`${CONDOMINIUMS_URL}/${id}/counts`)
      .pipe(map(toCondominiumCounts));
  }

  images(id: string): Observable<CondominiumImage[]> {
    return this.http
      .get<unknown>(`${CONDOMINIUMS_URL}/${id}/images`)
      .pipe(map(toCondominiumImages));
  }

  addImage(id: string, file: File): Observable<CondominiumImage[]> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<unknown>(`${CONDOMINIUMS_URL}/${id}/images`, body)
      .pipe(map(toCondominiumImages));
  }

  removeImage(id: string, imageId: string): Observable<CondominiumImage[]> {
    return this.http
      .delete<unknown>(`${CONDOMINIUMS_URL}/${id}/images/${imageId}`)
      .pipe(map(toCondominiumImages));
  }

  reorderImages(id: string, imageIds: readonly string[]): Observable<CondominiumImage[]> {
    return this.http
      .put<unknown>(`${CONDOMINIUMS_URL}/${id}/images/order`, { imageIds })
      .pipe(map(toCondominiumImages));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${CONDOMINIUMS_URL}/${id}`);
  }

  managers(id: string): Observable<Manager[]> {
    return this.http
      .get<unknown>(`${CONDOMINIUMS_URL}/${id}/managers`)
      .pipe(map((body) => toList(body, toManager)));
  }

  transferManager(id: string, transfer: ManagerTransfer): Observable<void> {
    return this.http.post<void>(`${CONDOMINIUMS_URL}/${id}/managers/transfer`, transfer);
  }

  removeManager(id: string, userId: string, reason?: string): Observable<void> {
    const params = reason ? new HttpParams().set('reason', reason) : undefined;
    return this.http.delete<void>(`${CONDOMINIUMS_URL}/${id}/managers/${userId}`, { params });
  }

  invites(id: string): Observable<ManagerInvite[]> {
    return this.http
      .get<unknown>(`${CONDOMINIUMS_URL}/${id}/manager-invites`)
      .pipe(map((body) => toList(body, toManagerInvite)));
  }

  invite(id: string, email: string): Observable<void> {
    return this.http.post<void>(`${CONDOMINIUMS_URL}/${id}/manager-invites`, { email });
  }

  requestManagement(id: string): Observable<void> {
    return this.http.post<void>(`${CONDOMINIUMS_URL}/${id}/manager-requests`, {});
  }

  approveRequest(id: string, inviteId: string): Observable<void> {
    return this.http.post<void>(
      `${CONDOMINIUMS_URL}/${id}/manager-invites/${inviteId}/approve`,
      {},
    );
  }

  cancelInvite(id: string, inviteId: string): Observable<void> {
    return this.http.delete<void>(`${CONDOMINIUMS_URL}/${id}/manager-invites/${inviteId}`);
  }

  myInvites(): Observable<ManagerInvite[]> {
    return this.http
      .get<unknown>(MY_INVITES_URL)
      .pipe(map((body) => toList(body, toManagerInvite)));
  }

  acceptInvite(inviteId: string, resides = true): Observable<void> {
    return this.http.post<void>(`${MY_INVITES_URL}/${inviteId}/accept`, { resides });
  }

  declineInvite(inviteId: string): Observable<void> {
    return this.http.post<void>(`${MY_INVITES_URL}/${inviteId}/decline`, {});
  }

  joinCode(id: string): Observable<string> {
    return this.http.get<unknown>(`${CONDOMINIUMS_URL}/${id}/join-code`).pipe(map(toJoinCode));
  }

  rotateJoinCode(id: string): Observable<string> {
    return this.http
      .post<unknown>(`${CONDOMINIUMS_URL}/${id}/join-code/rotate`, {})
      .pipe(map(toJoinCode));
  }

  previewJoin(code: string): Observable<JoinPreview> {
    return this.http
      .get<unknown>(`${JOINS_URL}/${encodeURIComponent(code)}`)
      .pipe(map(toJoinPreview));
  }

  join(code: string, request: JoinRequest): Observable<void> {
    return this.http.post<void>(`${JOINS_URL}/${encodeURIComponent(code)}`, request);
  }

  joinByCnpj(cnpj: string, request: JoinRequest): Observable<void> {
    return this.http.post<void>(`${CONDOMINIUMS_URL}/join`, { cnpj, ...request });
  }

  lookup(cnpj: string): Observable<CondominiumLookup | null> {
    return this.http.get<unknown>(`${CONDOMINIUMS_URL}/lookup/${cnpj}`).pipe(
      map(toCondominiumLookup),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
    );
  }

  rules(id: string): Observable<CondominiumRules> {
    return this.http.get<unknown>(`${CONDOMINIUMS_URL}/${id}/rules`).pipe(map(toCondominiumRules));
  }

  setShowManagerEmail(id: string, showEmail: boolean): Observable<void> {
    return this.http.patch<void>(`${CONDOMINIUMS_URL}/${id}/managers/me`, { showEmail });
  }

  leaveResidency(residentId: string): Observable<void> {
    return this.http.delete<void>(`${RESIDENTS_URL}/${residentId}`);
  }

  residents(
    id: string,
    status: ResidentStatus | null,
    search: string,
    page: number,
    size: number,
  ): Observable<Page<ResidentMember>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    if (search) params = params.set('q', search);
    return this.http
      .get<unknown>(`${CONDOMINIUMS_URL}/${id}/residents`, { params, observe: 'response' })
      .pipe(
        map((response) => {
          const total = Number(response.headers.get('X-Total-Count'));
          return toPage(
            toList(response.body, toResidentMember),
            page,
            size,
            Number.isInteger(total) ? total : undefined,
          );
        }),
      );
  }

  managed(page: number, size: number): Observable<Page<ManagedCondominium>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<unknown>(MY_MANAGED_URL, { params, observe: 'response' }).pipe(
      map((response) => {
        const body = response.body;
        if (!Array.isArray(body)) throw new Error('Invalid managed condominium list');
        const total = Number(response.headers.get('X-Total-Count'));
        return toPage(
          body.map(toManagedCondominium),
          page,
          size,
          Number.isInteger(total) ? total : undefined,
        );
      }),
    );
  }

  becomeResident(id: string): Observable<void> {
    return this.http.post<void>(`${CONDOMINIUMS_URL}/${id}/managers/me/residency`, {});
  }

  leaveManagerResidency(id: string): Observable<void> {
    return this.http.delete<void>(`${CONDOMINIUMS_URL}/${id}/managers/me/residency`);
  }

  decideResident(residentId: string, status: ResidentStatus): Observable<void> {
    return this.http.patch<void>(`${RESIDENTS_URL}/${residentId}`, { status });
  }
}
