import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter } from '../../../../shared/forms/format';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Card } from '../../../../shared/ui/card/card';
import { ChartSeries } from '../../../../shared/ui/chart/chart';
import { ChartPeriod, periodLabels } from '../../../../shared/ui/chart/period';
import { PeriodChart } from '../../../../shared/ui/chart/period-chart';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import { OwnerSummaryApi } from '../../data/owner-summary-api';
import { RentalPeriodPoint, StatsApi } from '../../data/stats-api';
import { OwnerSummary } from '../../owner-summary.model';

@Component({
  selector: 'app-owner-dashboard',
  imports: [TranslocoPipe, Alert, Card, EmptyState, PeriodChart, Skeleton, SkeletonBlock, StatCard],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerDashboard {
  private readonly api = inject(OwnerSummaryApi);
  private readonly locale = inject(LocaleService);
  private readonly stats = inject(StatsApi);
  private readonly transloco = inject(TranslocoService);
  private readonly language = toSignal(this.transloco.langChanges$);
  private readonly errorText = inject(ErrorText);

  readonly spots = output<number>();

  protected readonly placeholders = [1, 2, 3, 4];
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly summary = signal<OwnerSummary | null>(null);
  protected readonly error = this.errorText.state();

  protected readonly period = signal<ChartPeriod>('MONTH');
  protected readonly trendLoading = signal(true);
  protected readonly trendError = this.errorText.state();
  private readonly trend = signal<{ period: ChartPeriod; points: RentalPeriodPoint[] } | null>(
    null,
  );
  protected readonly trendChart = computed(() => {
    this.language();
    const trend = this.trend();
    const points = trend?.points ?? [];
    const series: ChartSeries[] = [
      {
        label: this.transloco.translate('dashboard.owner.chart.received'),
        data: points.map((point) => point.received),
        tone: 'primary',
      },
      {
        label: this.transloco.translate('dashboard.owner.chart.made'),
        data: points.map((point) => point.made),
        tone: 'secondary',
      },
    ];
    const starts = points.map((point) => point.start);
    return {
      labels: trend ? periodLabels(starts, trend.period, this.locale.language()) : [],
      series,
    };
  });

  constructor() {
    this.api
      .summary()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) => this.error.setFrom(error),
      });
    toObservable(this.period)
      .pipe(
        switchMap((period) => {
          this.trendLoading.set(true);
          this.trendError.clear();
          return this.stats.myRentals(period).pipe(
            map((points) => ({ period, points })),
            catchError((error: unknown) => {
              this.trendError.setFrom(error);
              return of(null);
            }),
            finalize(() => this.trendLoading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((trend) => this.trend.set(trend));
    effect(() => {
      const current = this.summary();
      if (current) this.spots.emit(current.spots);
    });
  }
}
