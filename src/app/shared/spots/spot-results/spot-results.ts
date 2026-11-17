import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { RatingSummary } from '../../reviews/review.model';
import { ReviewsApi } from '../../reviews/reviews-api';
import { Page } from '../../models/page';
import { Alert } from '../../ui/alert/alert';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { PAGE_SIZES, Paginator } from '../../ui/paginator/paginator';
import { Skeleton } from '../../ui/skeleton/skeleton';
import { ParkingSpot } from '../parking-spot.model';
import { SpotCard } from '../spot-card/spot-card';

@Component({
  selector: 'app-spot-results',
  imports: [TranslocoPipe, Alert, EmptyState, Paginator, Skeleton, SpotCard],
  templateUrl: './spot-results.html',
  styleUrl: './spot-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotResults {
  readonly result = input.required<Page<ParkingSpot> | null>();
  readonly loading = input(false);
  readonly compact = input(false);
  readonly error = input<string | null>(null);
  readonly queryParams = input<Record<string, string | null>>({});
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly ratings = signal(new Map<string, RatingSummary>());

  constructor() {
    const reviews = inject(ReviewsApi);
    toObservable(this.result)
      .pipe(
        switchMap((page) =>
          reviews
            .spotRatings(page?.items.map((spot) => spot.id) ?? [])
            .pipe(catchError(() => EMPTY)),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((ratings) => this.ratings.set(ratings));
  }
}
