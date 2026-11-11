import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { finalize } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { monthLabels } from '../../data/month-labels';
import { ManagerMonthlyStats, StatsApi } from '../../data/stats-api';
import { Chart, ChartSeries, ChartTone } from '../../../../shared/ui/chart/chart';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import { ManagedCondominiumsApi } from '../../data/managed-condominiums-api';
import {
  MANAGED_STATUSES,
  ManagedCondominium,
  ManagedStatus,
} from '../../managed-condominium.model';

const PAGE_SIZE = 100;

type TotalName = 'pendingResidents' | 'residents' | 'parkingSpots' | 'activeRentals';

const KPIS: readonly TotalName[] = [
  'pendingResidents',
  'residents',
  'parkingSpots',
  'activeRentals',
];

const STATUS_TONES: Record<ManagedStatus, ChartTone> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
  BLOCKED: 'danger',
  CLOSED: 'muted',
};

@Component({
  selector: 'app-manager-dashboard',
  imports: [TranslocoPipe, Alert, Button, Card, Chart, EmptyState, LoadingBlock, StatCard],
  templateUrl: './manager-dashboard.html',
  styleUrl: './manager-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerDashboard {
  private readonly api = inject(ManagedCondominiumsApi);
  private readonly errorText = inject(ErrorText);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stats = inject(StatsApi);
  private readonly transloco = inject(TranslocoService);
  private readonly language = toSignal(this.transloco.langChanges$);

  protected readonly kpis = KPIS;
  protected readonly condominiums = signal<ManagedCondominium[] | null>(null);
  protected readonly busyId = signal<string | null>(null);
  protected readonly error = this.errorText.state();

  protected readonly active = computed(() =>
    (this.condominiums() ?? []).filter((item) => item.status === 'ACTIVE'),
  );

  protected readonly notResiding = computed(() => this.active().filter((item) => !item.resides));

  protected readonly pendingLink = computed(() => {
    const withPending = this.active().filter((item) => item.pendingResidents > 0);
    if (withPending.length === 0) return null;
    return withPending.length === 1
      ? `/condominiums/${withPending[0].id}/residents`
      : '/condominiums/managed';
  });

  protected readonly totals = computed<Record<TotalName, number>>(() => {
    const items = this.active();
    const sum = (name: TotalName) => items.reduce((total, item) => total + item[name], 0);
    return {
      pendingResidents: sum('pendingResidents'),
      residents: sum('residents'),
      parkingSpots: sum('parkingSpots'),
      activeRentals: sum('activeRentals'),
    };
  });

  protected readonly statusChart = computed(() => {
    this.language();
    const items = this.condominiums() ?? [];
    const present = MANAGED_STATUSES.filter((status) => items.some((item) => item.status === status));
    const title = this.transloco.translate('condominiums.managerDashboard.statusChart');
    const series: ChartSeries[] = [
      {
        label: title,
        data: present.map((status) => items.filter((item) => item.status === status).length),
        tone: present.map((status) => STATUS_TONES[status]),
      },
    ];
    return {
      title,
      labels: present.map((status) => this.transloco.translate(`condominiums.status.${status}`)),
      series,
    };
  });

  protected readonly monthly = signal<ManagerMonthlyStats | null>(null);

  protected readonly monthlyChart = computed(() => {
    const stats = this.monthly();
    const language = this.language();
    if (!stats || !language) return null;
    const title = this.transloco.translate('condominiums.managerDashboard.monthlyChart');
    return {
      title,
      labels: monthLabels(stats.residentRequests, language),
      series: [
        {
          label: this.transloco.translate('condominiums.managerDashboard.monthly.requests'),
          data: stats.residentRequests.map((point) => point.count),
          tone: 'warning',
        },
        {
          label: this.transloco.translate('condominiums.managerDashboard.monthly.rentals'),
          data: stats.rentals.map((point) => point.count),
          tone: 'success',
        },
      ] satisfies ChartSeries[],
    };
  });

  protected readonly comparisonChart = computed(() => {
    this.language();
    const items = this.active();
    const title = this.transloco.translate('condominiums.managerDashboard.comparisonChart');
    const series = (name: TotalName, tone: ChartTone): ChartSeries => ({
      label: this.transloco.translate(`condominiums.managerDashboard.kpi.${name}`),
      data: items.map((item) => item[name]),
      tone,
    });
    return {
      title,
      labels: items.map((item) => item.name),
      series: [
        series('residents', 'primary'),
        series('pendingResidents', 'warning'),
        series('parkingSpots', 'secondary'),
        series('activeRentals', 'success'),
      ],
    };
  });

  constructor() {
    this.load();
  }

  protected becomeResident(item: ManagedCondominium): void {
    if (this.busyId()) return;
    this.busyId.set(item.id);
    this.error.clear();
    this.api
      .becomeResident(item.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private load(): void {
    this.stats
      .managerMonthly()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (stats) => this.monthly.set(stats), error: () => this.monthly.set(null) });
    this.api
      .list(PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.condominiums.set(items),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
