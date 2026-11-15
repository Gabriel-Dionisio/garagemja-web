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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter } from '../../../../shared/forms/format';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Card } from '../../../../shared/ui/card/card';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import { OwnerSummaryApi } from '../../data/owner-summary-api';
import { OwnerSummary } from '../../owner-summary.model';

@Component({
  selector: 'app-owner-dashboard',
  imports: [TranslocoPipe, Alert, Card, EmptyState, Skeleton, SkeletonBlock, StatCard],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerDashboard {
  private readonly api = inject(OwnerSummaryApi);
  private readonly locale = inject(LocaleService);

  readonly spots = output<number>();

  protected readonly placeholders = [1, 2, 3, 4];
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly summary = signal<OwnerSummary | null>(null);
  protected readonly error = inject(ErrorText).state();

  constructor() {
    this.api
      .summary()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) => this.error.setFrom(error),
      });
    effect(() => {
      const current = this.summary();
      if (current) this.spots.emit(current.spots);
    });
  }
}
