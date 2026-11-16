import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, finalize, map, of, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page } from '../../../../shared/models/page';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { FilterPanel } from '../../../../shared/ui/filter-panel/filter-panel';
import { AppMap, MapPin } from '../../../../shared/ui/map/map';
import { ChipToggle } from '../../../../shared/ui/chip-toggle/chip-toggle';
import { Page as PageLayout } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { PARKING_SPOT_SIZE_LABELS } from '../../../../shared/spots/parking-spot-status';
import {
  PARKING_SPOT_SIZES,
  ParkingSpot,
  ParkingSpotSize,
} from '../../../../shared/spots/parking-spot.model';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { SpotResults } from '../../../../shared/spots/spot-results/spot-results';
import { SpotFilter, SpotFilterValue } from '../../components/spot-filter/spot-filter';
import {
  SPOT_SORTS,
  SpotCriteria,
  SpotSort,
  activeCriteriaCount,
  criteriaFromParams,
  criteriaToParams,
} from '../../../../shared/spots/spot-search.model';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-spot-search-page',
  imports: [
    TranslocoPipe,
    AppMap,
    ChipGroup,
    ChipToggle,
    FilterPanel,
    PageHeader,
    PageLayout,
    SpotResults,
    SpotFilter,
  ],
  templateUrl: './spot-search-page.html',
  styleUrl: './spot-search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotSearchPage {
  private readonly api = inject(ParkingSpotsApi);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);
  private readonly route = inject(ActivatedRoute);

  protected readonly sizeTabs: readonly ChipOption<ParkingSpotSize>[] = [
    { value: null, labelKey: 'parkingSpots.tabs.anySize' },
    ...PARKING_SPOT_SIZES.map((size) => ({
      value: size,
      labelKey: PARKING_SPOT_SIZE_LABELS[size],
    })),
  ];
  protected readonly modeTabs: readonly ChipOption<'DAILY' | 'HOURLY'>[] = [
    { value: 'DAILY', labelKey: 'spotSearch.mode.daily' },
    { value: 'HOURLY', labelKey: 'spotSearch.mode.hourly' },
  ];
  protected readonly sortTabs: readonly ChipOption<SpotSort>[] = SPOT_SORTS.map((sort) => ({
    value: sort,
    labelKey: `spotSearch.sort.${sort}`,
  }));

  private readonly state = toSignal(this.route.queryParamMap.pipe(map(criteriaFromParams)), {
    initialValue: criteriaFromParams(this.route.snapshot.queryParamMap),
  });
  protected readonly criteria = computed(() => this.state().criteria);
  protected readonly page = computed(() => this.state().page);
  protected readonly pageSize = signal(PAGE_SIZE);
  protected readonly activeFilters = computed(() => activeCriteriaCount(this.criteria()));
  protected readonly cardParams = computed(() => {
    const { from, to } = this.criteria();
    return { from: from || null, to: to || null };
  });
  protected readonly pins = toSignal(
    this.api.mapPins().pipe(
      map((items) =>
        items.map((pin): MapPin => ({
          id: pin.condominiumId,
          label: pin.name,
          latitude: pin.latitude,
          longitude: pin.longitude,
          count: pin.available,
        })),
      ),
      catchError(() => of<MapPin[]>([])), // the map is optional: hide it instead of failing the page
    ),
    { initialValue: [] },
  );
  protected readonly filtersOpen = signal(false);
  protected readonly result = signal<Page<ParkingSpot> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = inject(ErrorText).state();

  constructor() {
    toObservable(
      computed(() => ({ criteria: this.criteria(), page: this.page(), size: this.pageSize() })),
    )
      .pipe(
        switchMap(({ criteria, page, size }) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.search(criteria, page, size).pipe(
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

  protected patch(change: Partial<SpotCriteria>): void {
    void this.router.navigate([], {
      queryParams: criteriaToParams({ ...this.criteria(), ...change }),
      replaceUrl: true,
    });
  }

  protected pickCondominium(id: string): void {
    this.patch({ condominiumId: this.criteria().condominiumId === id ? null : id });
  }

  protected apply(value: SpotFilterValue): void {
    this.patch(value);
  }

  protected changeSize(size: number): void {
    this.pageSize.set(size);
    this.goTo(0);
  }

  protected goTo(page: number): void {
    void this.router.navigate([], {
      queryParams: criteriaToParams(this.criteria(), page),
      replaceUrl: true,
    });
  }
}
