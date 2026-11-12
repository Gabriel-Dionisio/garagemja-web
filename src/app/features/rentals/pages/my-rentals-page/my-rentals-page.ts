import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page as ResultPage } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge, BadgeTone } from '../../../../shared/ui/badge/badge';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { RentalsApi } from '../../data/rentals-api';
import { RENTAL_STATUSES, Rental, RentalStatus, isRentalStatus } from '../../rental.model';

const STATUS_TONES: Record<RentalStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'info',
  ACTIVE: 'success',
  REFUSED: 'danger',
  CANCELED: 'danger',
  FINISHED: 'neutral',
};

@Component({
  selector: 'app-my-rentals-page',
  imports: [
    DecimalPipe,
    TranslocoPipe,
    Alert,
    Badge,
    ChipGroup,
    FilterPanel,
    Icon,
    ListItem,
    ListState,
    Page,
    PageHeader,
    Paginator,
  ],
  templateUrl: './my-rentals-page.html',
  styleUrl: './my-rentals-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRentalsPage {
  private readonly api = inject(RentalsApi);
  private readonly router = inject(Router);
  private readonly initialStatus = inject(ActivatedRoute).snapshot.queryParamMap.get('status');

  protected readonly tones = STATUS_TONES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly filters: readonly ChipOption<RentalStatus>[] = [
    { value: null, labelKey: 'rentals.all' },
    ...RENTAL_STATUSES.map((value) => ({ value, labelKey: `rentals.status.${value}` })),
  ];
  protected readonly error = inject(ErrorText).state();
  protected readonly status = signal<RentalStatus | null>(
    isRentalStatus(this.initialStatus) ? this.initialStatus : null,
  );
  protected readonly filtersOpen = signal(this.status() !== null);
  protected readonly activeFilters = computed(() => (this.status() ? 1 : 0));
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly loading = signal(true);
  protected readonly result = signal<ResultPage<Rental> | null>(null);
  protected readonly empty = computed(() => this.result()?.items.length === 0);
  private readonly request = computed(() => ({
    page: this.page(),
    size: this.size(),
    status: this.status(),
  }));

  constructor() {
    toObservable(this.request)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.clear();
        }),
        switchMap(({ page, size, status }) =>
          this.api.list(page, size, status).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.result.set(null);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.result.set(result);
        this.loading.set(false);
      });
  }

  protected filter(status: RentalStatus | null): void {
    this.status.set(status);
    this.page.set(0);
    void this.router.navigate([], {
      queryParams: { status },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }
}
