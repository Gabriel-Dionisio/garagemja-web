import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subscription, defer, retry, switchMap, tap, throwError, timer } from 'rxjs';
import { ErrorText } from '../i18n/error-text';
import { AppNotification } from './notification.model';
import { NotificationStream, StreamRejected } from './notification-stream';
import { NotificationsApi } from './notifications-api';

const PAGE_SIZE = 20;
const MAX_BACKOFF_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly api = inject(NotificationsApi);
  private readonly stream = inject(NotificationStream);
  private connection: Subscription | null = null;
  private requests = new Subscription();
  private listRequest: Subscription | null = null;
  private page = 0;
  private failures = 0;

  private readonly unreadState = signal(0);
  private readonly itemsState = signal<AppNotification[]>([]);
  private readonly hasNextState = signal(false);
  private readonly loadingState = signal(false);
  private readonly panelOpen = signal(false);

  readonly unread = this.unreadState.asReadonly();
  readonly items = this.itemsState.asReadonly();
  readonly hasNext = this.hasNextState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = inject(ErrorText).state();

  start(): void {
    if (this.connection) return;
    this.failures = 0;
    this.connection = defer(() => {
      this.refreshUnread();
      return this.stream.connect(() => this.opened());
    })
      .pipe(retry({ delay: (error: unknown) => this.reconnectAfter(error) }))
      .subscribe({
        next: (notification) => this.receive(notification),
        error: () => (this.connection = null),
      });
  }

  stop(): void {
    this.connection?.unsubscribe();
    this.connection = null;
    this.requests.unsubscribe();
    this.requests = new Subscription();
    this.listRequest = null;
    this.page = 0;
    this.unreadState.set(0);
    this.itemsState.set([]);
    this.hasNextState.set(false);
    this.loadingState.set(false);
    this.panelOpen.set(false);
    this.error.clear();
  }

  open(): void {
    this.panelOpen.set(true);
    this.page = 0;
    this.load(true);
  }

  close(): void {
    this.panelOpen.set(false);
  }

  loadMore(): void {
    if (this.loadingState() || !this.hasNextState()) return;
    this.page += 1;
    this.load(false);
  }

  markRead(id: string): void {
    const target = this.itemsState().find((item) => item.id === id);
    if (!target || target.read) return;
    this.requests.add(
      this.api.markRead(id).subscribe({
        next: () => {
          this.itemsState.update((list) =>
            list.map((item) => (item.id === id ? { ...item, read: true } : item)),
          );
          this.unreadState.update((count) => Math.max(0, count - 1));
        },
        error: () => undefined,
      }),
    );
  }

  markAllRead(): void {
    this.requests.add(
      this.api.markAllRead().subscribe({
        next: () => {
          this.itemsState.update((list) => list.map((item) => ({ ...item, read: true })));
          this.unreadState.set(0);
        },
        error: () => undefined,
      }),
    );
  }

  reload(): void {
    this.page = 0;
    this.load(true);
  }

  private reconnectAfter(error: unknown): Observable<unknown> {
    if (error instanceof StreamRejected && error.fatal) return throwError(() => error);
    const backoff = timer(Math.min(MAX_BACKOFF_MS, 1000 * 2 ** this.failures++));
    if (!(error instanceof StreamRejected && error.status === 401)) return backoff;
    // The stream uses fetch, so the session refresh happens through this HttpClient call.
    return backoff.pipe(
      switchMap(() => this.api.unreadCount()),
      tap((count) => this.unreadState.set(count)),
    );
  }

  private opened(): void {
    this.failures = 0;
    if (this.panelOpen()) this.open();
  }

  private load(reset: boolean): void {
    this.listRequest?.unsubscribe();
    this.loadingState.set(true);
    this.error.clear();
    this.listRequest = this.api.list(this.page, PAGE_SIZE).subscribe({
      next: (result) => {
        this.itemsState.update((current) =>
          reset ? result.items : [...current, ...result.items.filter((item) => !this.has(item))],
        );
        this.hasNextState.set(result.hasNext);
        this.loadingState.set(false);
      },
      error: (error: unknown) => {
        if (!reset) this.page -= 1;
        this.loadingState.set(false);
        this.error.setFrom(error);
      },
    });
    this.requests.add(this.listRequest);
  }

  private has(item: AppNotification): boolean {
    return this.itemsState().some((current) => current.id === item.id);
  }

  private receive(notification: AppNotification): void {
    if (this.panelOpen() && this.has(notification)) return;
    this.unreadState.update((count) => count + 1);
    if (this.panelOpen()) this.itemsState.update((current) => [notification, ...current]);
  }

  private refreshUnread(): void {
    this.requests.add(
      this.api.unreadCount().subscribe({
        next: (count) => this.unreadState.set(count),
        error: () => undefined,
      }),
    );
  }
}
