import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { REPORT_ONLY } from '../http/availability-context';
import { toUserProfile } from './auth.mapper';
import { Credentials, Registration, Role, UserProfile } from './auth.model';

const AUTH_URL = '/api/v1/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<UserProfile | null>(null);
  private refreshing: Observable<void> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  hasRole(role: Role): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }

  updateCurrentUser(changes: { name?: string }): void {
    this.currentUser.update((current) =>
      current && changes.name !== undefined ? { ...current, name: changes.name } : current,
    );
  }

  login(credentials: Credentials): Observable<UserProfile> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<unknown>(`${AUTH_URL}/login`, credentials)),
      map(toUserProfile),
      tap((user) => this.currentUser.set(user)),
      switchMap((user) => this.csrf().pipe(catchError(() => of(undefined)), map(() => user))),
    );
  }

  register(registration: Registration): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<unknown>(`${AUTH_URL}/register`, registration)),
      map(() => undefined),
    );
  }

  resendVerification(credentials: Credentials): Observable<void> {
    const { email, password } = credentials;
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<unknown>(`${AUTH_URL}/resend-verification`, { email, password }),
      ),
      map(() => undefined),
    );
  }

  confirmEmail(oobCode: string): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<unknown>(`${AUTH_URL}/verify-email`, { oobCode })),
      map(() => undefined),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<unknown>(`${AUTH_URL}/forgot-password`, { email })),
      map(() => undefined),
    );
  }

  resetPassword(oobCode: string, newPassword: string): Observable<void> {
    return this.csrf().pipe(
      switchMap(() =>
        this.http.post<unknown>(`${AUTH_URL}/reset-password`, { oobCode, newPassword }),
      ),
      map(() => undefined),
    );
  }

  sendPasswordReset(userId: string): Observable<void> {
    return this.http
      .post<unknown>(`${AUTH_URL}/users/${userId}/password-reset`, {})
      .pipe(map(() => undefined));
  }

  loadSession(): Observable<UserProfile | null> {
    return this.http
      .get<unknown>(`${AUTH_URL}/me`, { context: new HttpContext().set(REPORT_ONLY, true) })
      .pipe(
        map(toUserProfile),
        tap((user) => this.currentUser.set(user)),
        catchError((error: unknown) => {
          this.currentUser.set(null);
          return error instanceof HttpErrorResponse && error.status === 401
            ? of(null)
            : throwError(() => error);
        }),
      );
  }

  refreshSession(): Observable<void> {
    this.refreshing ??= this.csrf().pipe(
      switchMap(() => this.http.post<void>(`${AUTH_URL}/refresh`, {})),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) this.currentUser.set(null);
        return throwError(() => error);
      }),
      finalize(() => (this.refreshing = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshing;
  }

  logout(): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<void>(`${AUTH_URL}/logout`, {})),
      tap(() => this.currentUser.set(null)),
      switchMap(() => this.csrf().pipe(catchError(() => of(undefined)), map(() => undefined))),
    );
  }

  private csrf(): Observable<void> {
    return this.http.get<void>(`${AUTH_URL}/csrf`);
  }
}
