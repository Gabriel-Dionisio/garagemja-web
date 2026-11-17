import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page } from '../../../../shared/models/page';
import { ActionItem } from '../../../../shared/ui/action-list/action-item';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { CondominiumTabs } from '../../../../shared/ui/condominium-tabs/condominium-tabs';
import { CondominiumTabsState } from '../../../../shared/ui/condominium-tabs/condominium-tabs-state';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { Fab } from '../../../../shared/ui/fab/fab';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { Icon, IconName } from '../../../../shared/ui/icon/icon';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { ParkingSpotFilterForm } from '../../components/parking-spot-filter/parking-spot-filter';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import {
  isParkingSpotStatus,
  PARKING_SPOT_SIZE_LABELS,
  PARKING_SPOT_STATUS_LABELS,
  PARKING_SPOT_STATUS_TONES,
} from '../../../../shared/spots/parking-spot-status';
import {
  PARKING_SPOT_SIZES,
  PARKING_SPOT_STATUSES,
  ParkingSpot,
  ParkingSpotCondominium,
  ParkingSpotSize,
  ParkingSpotStatus,
} from '../../../../shared/spots/parking-spot.model';

const SKELETON_ROWS = [0, 1, 2, 3];

interface SpotAction {
  id: 'approve' | 'reject' | 'block' | 'reactivate';
  icon: IconName;
  primary: boolean;
  status: ParkingSpotStatus;
}

const MANAGER_ACTIONS: Record<ParkingSpotStatus, readonly SpotAction[]> = {
  PENDING: [
    { id: 'approve', status: 'ACTIVE', icon: 'check', primary: true },
    { id: 'reject', status: 'REJECTED', icon: 'close', primary: false },
  ],
  ACTIVE: [{ id: 'block', status: 'BLOCKED', icon: 'ban', primary: false }],
  BLOCKED: [{ id: 'reactivate', status: 'ACTIVE', icon: 'user-check', primary: true }],
  REJECTED: [],
};

@Component({
  selector: 'app-parking-spots-page',
  imports: [
    ActionItem,
    Fab,
    TranslocoPipe,
    RouterLink,
    Alert,
    Badge,
    Button,
    ChipGroup,
    CondominiumTabs,
    FilterPanel,
    Icon,
    IconButton,
    ListItem,
    ListState,
    PageHeader,
    PageLayout,
    Paginator,
    ParkingSpotFilterForm,
    Skeleton,
    SkeletonBlock,
  ],
  templateUrl: './parking-spots-page.html',
  styleUrl: './parking-spots-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParkingSpotsPage {
  private readonly api = inject(ParkingSpotsApi);
  private readonly confirm = inject(ConfirmService);
  private readonly errorText = inject(ErrorText);
  private readonly tabsState = inject(CondominiumTabsState);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();
  readonly initialStatus = input<string>(undefined, { alias: 'status' });

  protected readonly statusTabs: readonly ChipOption<ParkingSpotStatus>[] = [
    { value: null, labelKey: 'parkingSpots.tabs.all' },
    ...PARKING_SPOT_STATUSES.map((status) => ({
      value: status,
      labelKey: `parkingSpots.tabs.${status}`,
    })),
  ];
  protected readonly sizeTabs: readonly ChipOption<ParkingSpotSize>[] = [
    { value: null, labelKey: 'parkingSpots.tabs.anySize' },
    ...PARKING_SPOT_SIZES.map((size) => ({
      value: size,
      labelKey: PARKING_SPOT_SIZE_LABELS[size],
    })),
  ];
  protected readonly tones = PARKING_SPOT_STATUS_TONES;
  protected readonly statusLabels = PARKING_SPOT_STATUS_LABELS;
  protected readonly sizeLabels = PARKING_SPOT_SIZE_LABELS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly skeletonRows = SKELETON_ROWS;

  protected readonly condominium = signal<ParkingSpotCondominium | null>(null);
  protected readonly loading = signal(true);
  protected readonly status = linkedSignal<ParkingSpotStatus | null>(() => {
    const initial = this.initialStatus();
    return isParkingSpotStatus(initial) ? initial : null;
  });
  protected readonly size = signal<ParkingSpotSize | null>(null);
  protected readonly search = signal('');
  protected readonly filtersOpen = signal(false);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly result = signal<Page<ParkingSpot> | null>(null);
  protected readonly listLoading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = this.errorText.state({
    403: 'errors.parkingSpots.forbidden',
    404: 'errors.condominium.notFound',
  });
  private readonly reloads = signal(0);

  protected readonly knownName = computed(() => this.tabsState.nameOf(this.id()));
  protected readonly canRegister = computed(() => this.condominium()?.status === 'ACTIVE');
  protected readonly activeFilters = computed(
    () => (this.status() ? 1 : 0) + (this.size() ? 1 : 0) + (this.search() ? 1 : 0),
  );

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.condominium(id).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((condominium) => {
        this.condominium.set(condominium);
        this.tabsState.set(condominium, false);
        this.loading.set(false);
      });

    toObservable(
      computed(() => ({
        id: this.id(),
        filter: {
          status: this.status(),
          size: this.size(),
          search: this.search(),
          mine: false,
        },
        page: this.page(),
        pageSize: this.pageSize(),
        reload: this.reloads(),
      })),
    )
      .pipe(
        switchMap(({ id, filter, page, pageSize }) => {
          this.listLoading.set(true);
          return this.api.list(id, filter, page, pageSize).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
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

  protected actionsFor(spot: ParkingSpot): readonly SpotAction[] {
    return MANAGER_ACTIONS[spot.status];
  }

  protected ownerLine(spot: ParkingSpot): string {
    const owner = spot.owner;
    if (!owner) return '';
    return [owner.name, [owner.block, owner.unit].filter(Boolean).join(' / ')]
      .filter(Boolean)
      .join(' · ');
  }

  protected selectStatus(status: ParkingSpotStatus | null): void {
    this.status.set(status);
    this.page.set(0);
  }

  protected selectSize(size: ParkingSpotSize | null): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected applySearch(search: string): void {
    this.search.set(search);
    this.page.set(0);
  }

  protected changeSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  protected decide(spot: ParkingSpot, action: SpotAction): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.clear();
    this.callFor(spot, action)
      .pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.reloads.update((count) => count + 1),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private callFor(spot: ParkingSpot, action: SpotAction): Observable<unknown> {
    const dialog = {
      title: `parkingSpots.confirm.${action.id}.title`,
      message: `parkingSpots.confirm.${action.id}.message`,
      confirmLabel: `parkingSpots.confirm.${action.id}.confirm`,
      params: { number: spot.number },
      danger: !action.primary,
    };
    if (action.status === 'REJECTED' || action.status === 'BLOCKED') {
      return this.confirm
        .askReason({
          ...dialog,
          reason: { label: 'parkingSpots.fields.statusReason', maxLength: 255 },
        })
        .pipe(
          switchMap((reason) =>
            reason ? this.api.setStatus(spot.id, action.status, reason) : EMPTY,
          ),
        );
    }
    return this.confirm
      .confirm(dialog)
      .pipe(
        switchMap((confirmed) => (confirmed ? this.api.setStatus(spot.id, action.status) : EMPTY)),
      );
  }
}
