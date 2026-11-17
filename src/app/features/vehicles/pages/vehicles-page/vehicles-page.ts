import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, filter, finalize, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Page as PageResult } from '../../../../shared/models/page';
import { ActionItem } from '../../../../shared/ui/action-list/action-item';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { Fab } from '../../../../shared/ui/fab/fab';
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
import { SearchFilter } from '../../../../shared/ui/search-filter/search-filter';
import { VehiclesApi } from '../../../../shared/vehicles/vehicles-api';
import { VehicleListItem } from '../../../../shared/vehicles/vehicle.model';
import { displayPlate } from '../../../../shared/forms/plate';

@Component({
  selector: 'app-vehicles-page',
  imports: [
    RouterLink,
    TranslocoPipe,
    ActionItem,
    Alert,
    Button,
    Fab,
    FilterPanel,
    Icon,
    ListItem,
    ListState,
    Page,
    PageHeader,
    Paginator,
    SearchFilter,
  ],
  templateUrl: './vehicles-page.html',
  styleUrl: './vehicles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclesPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(VehiclesApi);
  private readonly confirm = inject(ConfirmService);

  protected readonly error = inject(ErrorText).state({ 409: 'errors.vehicles.inUse' });
  protected readonly loading = signal(true);
  protected readonly result = signal<PageResult<VehicleListItem> | null>(null);
  protected readonly search = signal('');
  protected readonly page = signal(0);
  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly reloads = signal(0);
  protected readonly filtersOpen = signal(false);
  protected readonly activeFilters = computed(() => (this.search() ? 1 : 0));
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly displayPlate = displayPlate;

  constructor() {
    toObservable(
      computed(() => ({
        search: this.search(),
        page: this.page(),
        size: this.pageSize(),
        reloads: this.reloads(),
      })),
    )
      .pipe(
        switchMap(({ search, page, size }) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.list(search, page, size).pipe(
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

  protected title(vehicle: VehicleListItem): string {
    return [vehicle.brand, vehicle.model].filter(Boolean).join(' ') || displayPlate(vehicle.plate);
  }

  protected place(vehicle: VehicleListItem): string {
    const { residency } = vehicle;
    if (!residency) return '';
    const unit = [residency.block, residency.unit].filter(Boolean).join(' / ');
    return unit ? `${residency.condominiumName} · ${unit}` : residency.condominiumName;
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

  protected remove(vehicle: VehicleListItem): void {
    this.confirm
      .confirm({
        title: 'vehicles.delete.title',
        message: 'vehicles.delete.message',
        params: { plate: displayPlate(vehicle.plate) },
        confirmLabel: 'vehicles.delete.confirm',
        danger: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.api.remove(vehicle.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.reloads.update((count) => count + 1),
        error: (error: unknown) => this.error.setFrom(error),
      });
  }
}
