import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, catchError, finalize, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter, periodText } from '../../../../shared/forms/format';
import { Page as PageResult } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Avatar } from '../../../../shared/ui/avatar/avatar';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { SearchFilter } from '../../../../shared/ui/search-filter/search-filter';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { OwnedRental, RentalStatus } from '../../owned-rental.model';
import { displayPlate } from '../../../../shared/forms/plate';
import { REQUEST_STATUSES, REQUEST_TONES, isRequestStatus } from '../../request-status';

@Component({
  selector: 'app-requests-page',
  imports: [
    TranslocoPipe,
    Alert,
    Avatar,
    Badge,
    Button,
    ChipGroup,
    FilterPanel,
    ListItem,
    ListState,
    Page,
    PageHeader,
    Paginator,
    SearchFilter,
  ],
  templateUrl: './requests-page.html',
  styleUrl: './requests-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(OwnedRentalsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly locale = inject(LocaleService);
  private readonly initialStatus = inject(ActivatedRoute).snapshot.queryParamMap.get('status');

  protected readonly tones = REQUEST_TONES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly statusTabs: readonly ChipOption<RentalStatus>[] = [
    { value: null, labelKey: 'requests.tabs.all' },
    ...REQUEST_STATUSES.map((value) => ({ value, labelKey: `requests.status.${value}` })),
  ];
  protected readonly error = inject(ErrorText).state({ 409: 'requests.conflict' });
  protected readonly status = signal<RentalStatus | null>(
    isRequestStatus(this.initialStatus) ? this.initialStatus : 'PENDING',
  );
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly loading = signal(true);
  protected readonly result = signal<PageResult<OwnedRental> | null>(null);
  protected readonly deciding = signal<string | null>(null);
  protected readonly filtersOpen = signal(false);
  protected readonly activeFilters = computed(
    () => (this.status() ? 1 : 0) + (this.search() ? 1 : 0),
  );
  private readonly reloads = signal(0);

  constructor() {
    toObservable(
      computed(() => ({
        status: this.status(),
        search: this.search(),
        page: this.page(),
        size: this.size(),
        reload: this.reloads(),
      })),
    )
      .pipe(
        switchMap(({ status, search, page, size }) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.list(page, size, status, search).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.result.set(null);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected period(rental: OwnedRental) {
    return periodText(rental, this.locale.language());
  }

  protected vehicle(rental: OwnedRental): string {
    const model = [rental.vehicleBrand, rental.vehicleModel].filter(Boolean).join(' ');
    return [model, displayPlate(rental.vehiclePlate)].filter(Boolean).join(' · ');
  }

  protected selectStatus(status: RentalStatus | null): void {
    this.status.set(status);
    this.page.set(0);
    void this.router.navigate([], {
      queryParams: { status },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected applySearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  protected approve(rental: OwnedRental): void {
    this.run(
      rental,
      this.confirm.confirm({
        title: 'requests.dialog.approve.title',
        message: 'requests.dialog.approve.message',
        params: { spot: rental.parkingSpotNumber },
        confirmLabel: 'requests.dialog.approve.confirm',
      }),
      () => this.api.approve(rental.id),
    );
  }

  protected refuse(rental: OwnedRental): void {
    this.run(
      rental,
      this.confirm.askReason({
        title: 'requests.dialog.refuse.title',
        message: 'requests.dialog.refuse.message',
        params: { spot: rental.parkingSpotNumber },
        confirmLabel: 'requests.dialog.refuse.confirm',
        danger: true,
        reason: { label: 'requests.dialog.refuse.reason', maxLength: 255 },
      }),
      (reason) => this.api.refuse(rental.id, String(reason)),
    );
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  private run(
    rental: OwnedRental,
    answer: Observable<boolean | string | null>,
    action: (answer: boolean | string) => Observable<void>,
  ): void {
    if (this.deciding()) return;
    this.deciding.set(rental.id);
    this.error.clear();
    answer
      .pipe(
        switchMap((value) => (value ? action(value) : EMPTY)),
        finalize(() => this.deciding.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.reloads.update((count) => count + 1),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
