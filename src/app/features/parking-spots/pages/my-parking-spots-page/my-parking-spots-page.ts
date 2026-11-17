import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { Page } from '../../../../shared/models/page';
import { ActionItem } from '../../../../shared/ui/action-list/action-item';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { Fab } from '../../../../shared/ui/fab/fab';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { dateFormatter, moneyFormatter } from '../../../../shared/forms/format';
import { PARKING_SPOT_SIZE_LABELS, spotBadge } from '../../../../shared/spots/parking-spot-status';
import {
  PARKING_SPOT_SIZES,
  PARKING_SPOT_STATUSES,
  ParkingSpot,
  ParkingSpotSize,
  ParkingSpotStatus,
} from '../../../../shared/spots/parking-spot.model';
import { ParkingSpotFilterForm } from '../../components/parking-spot-filter/parking-spot-filter';

@Component({
  selector: 'app-my-parking-spots-page',
  imports: [
    ParkingSpotFilterForm,
    ActionItem,
    Fab,
    TranslocoPipe,
    RouterLink,
    Alert,
    Badge,
    Button,
    IconButton,
    ChipGroup,
    FilterPanel,
    Icon,
    ListItem,
    ListState,
    PageHeader,
    PageLayout,
    Paginator,
  ],
  templateUrl: './my-parking-spots-page.html',
  styleUrl: './my-parking-spots-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyParkingSpotsPage {
  private readonly api = inject(ParkingSpotsApi);
  private readonly locale = inject(LocaleService);

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
  protected readonly sizeLabels = PARKING_SPOT_SIZE_LABELS;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly badge = spotBadge;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly date = computed(() => dateFormatter(this.locale.language()));

  protected readonly status = signal<ParkingSpotStatus | null>(null);
  protected readonly spotSize = signal<ParkingSpotSize | null>(null);
  protected readonly search = signal('');
  protected readonly activeFilters = computed(
    () => (this.status() ? 1 : 0) + (this.spotSize() ? 1 : 0) + (this.search() ? 1 : 0),
  );
  protected readonly filtersOpen = signal(false);
  protected readonly page = signal(0);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly result = signal<Page<ParkingSpot> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = inject(ErrorText).state({ 403: 'errors.parkingSpots.forbidden' });

  constructor() {
    toObservable(
      computed(() => ({
        status: this.status(),
        size: this.spotSize(),
        search: this.search(),
        page: this.page(),
        pageSize: this.pageSize(),
      })),
    )
      .pipe(
        switchMap(({ status, size, search, page, pageSize }) => {
          this.loading.set(true);
          this.error.clear();
          const filter = { status, size, search, mine: true };
          return this.api.list(null, filter, page, pageSize).pipe(
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

  protected heading(spot: ParkingSpot): { label: string; params: Record<string, string> } {
    const block = spot.owner?.block;
    return block
      ? { label: 'parkingSpots.mine.spotBlock', params: { number: spot.number, block } }
      : { label: 'parkingSpots.spot', params: { number: spot.number } };
  }

  protected selectStatus(status: ParkingSpotStatus | null): void {
    this.status.set(status);
    this.page.set(0);
  }

  protected selectSpotSize(size: ParkingSpotSize | null): void {
    this.spotSize.set(size);
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
}
