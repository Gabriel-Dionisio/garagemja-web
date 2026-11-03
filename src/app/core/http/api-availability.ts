import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  finalize,
  interval,
  map,
  of,
  take,
} from 'rxjs';
import { AuthService } from '../auth/auth-service';

export const STATUS_URL = '/api/v1/status';
interface ApiStatus {
  status?: string;
  version?: string;
  components?: Record<string, string>;
}

const RETRY_DELAYS_SECONDS = [5, 10, 15];
const GUEST_PREFIXES = ['/login', '/register'];

@Injectable({ providedIn: 'root' })
export class ApiAvailability {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private countdown: Subscription | null = null;
  private attempt = 0;
  private readonly outcome = new Subject<boolean>();

  readonly apiVersion = signal<string | null>(null);
  readonly degraded = signal(false);
  readonly unavailable = signal(false);
  readonly checking = signal(false);
  readonly secondsLeft = signal(0);
  readonly delay = signal(RETRY_DELAYS_SECONDS[0]);

  report(): void {
    if (!this.unavailable() && !this.checking()) this.probe();
  }

  reportAndWait(): Observable<boolean> {
    this.report();
    return this.outcome.pipe(take(1));
  }

  retryNow(): void {
    if (!this.checking()) this.probe();
  }

  private probe(): void {
    this.countdown?.unsubscribe();
    this.checking.set(true);
    this.http
      .get<ApiStatus>(STATUS_URL)
      .pipe(
        map((body) => this.accept(body)),
        catchError(() => of(false)),
        finalize(() => this.checking.set(false)),
      )
      .subscribe((healthy) => (healthy ? this.recover() : this.scheduleRetry()));
  }

  loadVersion(): void {
    if (this.apiVersion()) return;
    this.http
      .get<ApiStatus>(STATUS_URL)
      .pipe(catchError(() => of(null)))
      .subscribe((body) => body && this.accept(body));
  }

  private accept(body: ApiStatus): boolean {
    const healthy = body.status === 'UP';
    if (healthy && body.version) this.apiVersion.set(body.version);
    this.degraded.set(Object.values(body.components ?? {}).some((value) => value !== 'UP'));
    return healthy;
  }

  private scheduleRetry(): void {
    this.unavailable.set(true);
    const delay = RETRY_DELAYS_SECONDS[Math.min(this.attempt++, RETRY_DELAYS_SECONDS.length - 1)];
    this.delay.set(delay);
    this.secondsLeft.set(delay);
    this.countdown = interval(1000)
      .pipe(take(delay))
      .subscribe({
        next: (tick) => this.secondsLeft.set(delay - tick - 1),
        complete: () => this.probe(),
      });
  }

  private recover(): void {
    const wasUnavailable = this.unavailable();
    this.attempt = 0;
    this.unavailable.set(false);
    this.outcome.next(wasUnavailable);
    if (!wasUnavailable || this.auth.isAuthenticated()) return;
    this.auth.loadSession().subscribe({
      next: (user) => {
        if (user && GUEST_PREFIXES.some((prefix) => this.router.url.startsWith(prefix))) {
          void this.router.navigateByUrl('/home');
        }
      },
      error: () => undefined,
    });
  }
}
