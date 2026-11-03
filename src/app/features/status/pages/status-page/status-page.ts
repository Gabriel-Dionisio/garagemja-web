import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Observable, expand, filter, forkJoin, fromEvent, merge, switchMap, timer } from 'rxjs';
import { version } from '../../../../../../package.json';
import { AuthService } from '../../../../core/auth/auth-service';
import { Icon } from '../../../../shared/ui/icon/icon';
import { StatusApi } from '../../data/status-api';
import { ServiceStatus, StatusHistory } from '../../status.model';

const REFRESH_MS = 60_000;
const JITTER_MS = 10_000;

interface Snapshot {
  status: ServiceStatus | null;
  history: StatusHistory | null;
}

@Component({
  selector: 'app-status-page',
  imports: [TranslocoPipe, Icon],
  templateUrl: './status-page.html',
  styleUrl: './status-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPage {
  private readonly api = inject(StatusApi);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);
  private readonly canGoBack = !!this.router.currentNavigation()?.previousNavigation;
  private readonly visible = () => document.visibilityState === 'visible';
  protected readonly web = version;
  private readonly snapshot = toSignal(
    merge(
      timer(0)
        .pipe(expand(() => timer(REFRESH_MS + Math.random() * JITTER_MS)))
        .pipe(filter(this.visible)),
      fromEvent(document, 'visibilitychange').pipe(filter(this.visible)),
    ).pipe(
      switchMap((): Observable<Snapshot> =>
        forkJoin({ status: this.api.load(), history: this.api.history() }),
      ),
    ),
    { initialValue: { status: null, history: null } as Snapshot },
  );
  protected readonly status = computed(() => this.snapshot().status);
  protected readonly history = computed(() => this.snapshot().history);
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  protected readonly checkedAt = computed(() =>
    this.status()?.checkedAt.toLocaleTimeString(this.lang()),
  );
  protected readonly uptimePercent = computed(() => {
    const percent = this.history()?.uptimePercent;
    return percent == null
      ? null
      : new Intl.NumberFormat(this.lang(), { maximumFractionDigits: 1 }).format(percent);
  });
  protected readonly bars = computed(() => {
    this.lang();
    return (this.history()?.buckets ?? []).map(({ start, state }) => ({
      key: start.getTime(),
      state,
      label: this.bucketLabel(start, state),
    }));
  });
  protected readonly historySummary = computed(() => {
    const buckets = this.history()?.buckets ?? [];
    const count = (state: string) => buckets.filter((bucket) => bucket.state === state).length;
    this.lang();
    return this.transloco.translate('status.historySummary', {
      down: count('down'),
      degraded: count('degraded'),
    });
  });
  protected readonly components = computed(() => {
    this.lang();
    return (this.status()?.components ?? []).map(({ name, up }) => {
      const key = `status.components.${name}`;
      const label = this.transloco.translate(key);
      return { name, up, label: label === key ? name : label };
    });
  });

  protected back(): void {
    if (this.canGoBack) this.location.back();
    else void this.router.navigateByUrl(this.auth.isAuthenticated() ? '/home' : '/login');
  }

  private bucketLabel(start: Date, state: string): string {
    const when = start.toLocaleString(this.lang(), {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return this.transloco.translate('status.bucket.label', {
      when,
      state: this.transloco.translate('status.bucket.' + state),
    });
  }
}
