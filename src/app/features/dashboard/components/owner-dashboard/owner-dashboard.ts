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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, Observable, catchError, finalize, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { moneyFormatter, periodText } from '../../../../shared/forms/format';
import { Page } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge, BadgeTone } from '../../../../shared/ui/badge/badge';
import { Card } from '../../../../shared/ui/card/card';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Icon } from '../../../../shared/ui/icon/icon';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { OwnedRental, OwnedRentalSummary, RentalStatus } from '../../owned-rental.model';

const STATUS_TONES: Record<RentalStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'info',
  ACTIVE: 'success',
  REFUSED: 'danger',
  CANCELED: 'danger',
  FINISHED: 'neutral',
  EXPIRED: 'neutral',
};

const STATUS_OPTIONS: readonly ChipOption<RentalStatus>[] = [
  { value: null, labelKey: 'dashboard.rentals.all' },
  ...(Object.keys(STATUS_TONES) as RentalStatus[]).map((status) => ({
    value: status,
    labelKey: `dashboard.rentals.status.${status}`,
  })),
];

@Component({
  selector: 'app-owner-dashboard',
  imports: [
    RouterLink,
    TranslocoPipe,
    Alert,
    Badge,
    Card,
    ChipGroup,
    EmptyState,
    Icon,
    IconButton,
    ListItem,
    ListState,
    Paginator,
    Skeleton,
    SkeletonBlock,
    StatCard,
  ],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnerDashboard {
  private readonly api = inject(OwnedRentalsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly errorText = inject(ErrorText);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  readonly spots = output<number>();

  protected readonly placeholders = [1, 2, 3, 4];
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly tones = STATUS_TONES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly period = (rental: OwnedRental) => periodText(rental, this.locale.language());

  protected readonly summary = signal<OwnedRentalSummary | null>(null);
  protected readonly status = signal<RentalStatus | null>(null);
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly result = signal<Page<OwnedRental> | null>(null);
  protected readonly listLoading = signal(true);
  protected readonly busyId = signal<string | null>(null);
  protected readonly error = this.errorText.state();
  protected readonly listError = this.errorText.state();
  private readonly reloads = signal(0);

  constructor() {
    this.loadSummary();
    effect(() => {
      const current = this.summary();
      if (current) this.spots.emit(current.spots);
    });
    toObservable(
      computed(() => ({
        page: this.page(),
        size: this.size(),
        status: this.status(),
        reload: this.reloads(),
      })),
    )
      .pipe(
        switchMap(({ page, size, status }) => {
          this.listLoading.set(true);
          this.listError.clear();
          return this.api.list(page, size, status).pipe(
            catchError((error: unknown) => {
              this.listError.setFrom(error);
              this.result.set(null);
              return EMPTY;
            }),
            finalize(() => this.listLoading.set(false)),
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

  protected approve(rental: OwnedRental): void {
    this.run(
      this.confirm
        .confirm(this.dialog('approve', rental, false))
        .pipe(switchMap((ok) => (ok ? this.api.approve(rental.id) : EMPTY))),
      rental,
    );
  }

  protected refuse(rental: OwnedRental): void {
    const dialog = {
      ...this.dialog('refuse', rental, true),
      reason: { label: 'dashboard.rentals.confirm.reason', maxLength: 255 },
    };
    this.run(
      this.confirm
        .askReason(dialog)
        .pipe(switchMap((reason) => (reason ? this.api.refuse(rental.id, reason) : EMPTY))),
      rental,
    );
  }

  private dialog(action: 'approve' | 'refuse', rental: OwnedRental, danger: boolean) {
    const prefix = `dashboard.rentals.confirm.${action}`;
    return {
      title: `${prefix}.title`,
      message: `${prefix}.message`,
      confirmLabel: `${prefix}.confirm`,
      params: { number: rental.parkingSpotNumber },
      danger,
    };
  }

  private run(action: Observable<void>, rental: OwnedRental): void {
    if (this.busyId()) return;
    this.busyId.set(rental.id);
    this.error.clear();
    action
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loadSummary();
          this.reloads.update((count) => count + 1);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private loadSummary(): void {
    this.api
      .summary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
