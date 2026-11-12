import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { VehiclesApi } from '../../data/vehicles-api';
import { VehicleListItem } from '../../vehicle.model';
import { displayPlate } from '../../vehicle-plate';

@Component({
  selector: 'app-vehicles-page',
  imports: [RouterLink, TranslocoPipe, Alert, Button, Icon, ListItem, ListState, Page, PageHeader],
  templateUrl: './vehicles-page.html',
  styleUrl: './vehicles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclesPage {
  private readonly api = inject(VehiclesApi);

  protected readonly error = inject(ErrorText).state();
  protected readonly loading = signal(true);
  protected readonly vehicles = signal<VehicleListItem[] | null>(null);
  protected readonly empty = computed(() => this.vehicles()?.length === 0);
  protected readonly displayPlate = displayPlate;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.clear();
    this.api.listMine().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.setFrom(error);
        this.vehicles.set(null);
        this.loading.set(false);
      },
    });
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
}
