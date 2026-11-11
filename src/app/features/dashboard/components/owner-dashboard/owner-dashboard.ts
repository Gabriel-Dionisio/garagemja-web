import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Card } from '../../../../shared/ui/card/card';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { OwnedRentalSummary } from '../../owned-rental.model';
import { RentalsList } from '../rentals-list/rentals-list';

@Component({
  selector: 'app-owner-dashboard',
  imports: [
    DecimalPipe,
    TranslocoPipe,
    Alert,
    Card,
    EmptyState,
    RentalsList,
    Skeleton,
    SkeletonBlock,
    StatCard,
  ],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerDashboard {
  protected readonly placeholders = [1, 2, 3, 4];
  private readonly api = inject(OwnedRentalsApi);
  private readonly errorText = inject(ErrorText);

  protected readonly summary = signal<OwnedRentalSummary | null>(null);
  protected readonly error = this.errorText.state();
  readonly hideWhenEmpty = input(false);
  protected readonly hidden = computed(() => this.hideWhenEmpty() && this.summary()?.spots === 0);

  constructor() {
    this.api
      .summary()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
