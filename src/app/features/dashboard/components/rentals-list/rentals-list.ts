import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge, BadgeTone } from '../../../../shared/ui/badge/badge';
import { ChipToggle } from '../../../../shared/ui/chip-toggle/chip-toggle';
import { DataTable } from '../../../../shared/ui/data-table/data-table';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { OwnedRental, RentalStatus } from '../../owned-rental.model';

const STATUS_TONES: Record<RentalStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'info',
  ACTIVE: 'success',
  REFUSED: 'danger',
  CANCELED: 'danger',
  FINISHED: 'neutral',
};

const STATUSES = Object.keys(STATUS_TONES) as RentalStatus[];

@Component({
  selector: 'app-rentals-list',
  imports: [
    DecimalPipe,
    TranslocoPipe,
    Alert,
    Badge,
    ChipToggle,
    DataTable,
    EmptyState,
    Paginator,
    Skeleton,
  ],
  templateUrl: './rentals-list.html',
  styleUrl: './rentals-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RentalsList {
  private readonly api = inject(OwnedRentalsApi);
  private readonly errorText = inject(ErrorText);

  readonly mode = input.required<'owned' | 'rented'>();
  readonly hideWhenEmpty = input(false);
  readonly heading = input<string>();

  protected readonly tones = STATUS_TONES;
  protected readonly statuses = STATUSES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly status = signal<RentalStatus | null>(null);
  protected readonly result = signal<Page<OwnedRental> | null>(null);
  protected readonly error = this.errorText.state();
  protected readonly hidden = computed(
    () => this.hideWhenEmpty() && this.status() === null && this.result()?.items.length === 0,
  );
  private readonly request = computed(() => ({
    mode: this.mode(),
    page: this.page(),
    size: this.size(),
    status: this.status(),
  }));

  constructor() {
    toObservable(this.request)
      .pipe(
        switchMap(({ mode, page, size, status }) => {
          const source =
            mode === 'owned'
              ? this.api.list(page, size, status)
              : this.api.rented(page, size, status);
          return source.pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected filter(status: RentalStatus | null): void {
    this.status.set(status);
    this.page.set(0);
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }
}
