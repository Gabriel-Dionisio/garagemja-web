import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { todayIso } from '../../../../shared/forms/date-format';
import { moneyFormatter } from '../../../../shared/forms/format';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { DateField } from '../../../../shared/ui/date-field/date-field';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { SelectField, SelectOption } from '../../../../shared/ui/select-field/select-field';
import {
  ParkingSpot,
  SpotAvailability,
  SpotRules,
} from '../../../parking-spots/parking-spot.model';
import { RentalsApi } from '../../../rentals/data/rentals-api';
import { VehiclesApi } from '../../../vehicles/data/vehicles-api';
import { VehicleListItem } from '../../../vehicles/vehicle.model';
import { displayPlate } from '../../../../shared/forms/plate';
import { RentalMode, quoteRental } from '../../rental-quote';

export interface RequestRentalDialogData {
  spot: ParkingSpot;
  availabilities: SpotAvailability[];
  rules: SpotRules;
  from: string;
  to: string;
}

const hourOptions = (from: number, to: number): SelectOption[] =>
  Array.from({ length: to - from + 1 }, (_, index) => {
    const hour = String(from + index);
    return { value: hour, label: `${hour}h`, literal: true };
  });

@Component({
  selector: 'app-request-rental-dialog',
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    RouterLink,
    Alert,
    Button,
    ChipGroup,
    DateField,
    FormActions,
    FormSection,
    SelectField,
  ],
  templateUrl: './request-rental-dialog.html',
  styleUrl: './request-rental-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestRentalDialog {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly data = inject<RequestRentalDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly rentals = inject(RentalsApi);
  private readonly locale = inject(LocaleService);

  protected readonly today = todayIso();
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly fromOptions = hourOptions(0, 23);
  protected readonly toOptions = hourOptions(1, 24);
  protected readonly hourlyAllowed =
    this.data.rules.hourlyRentalsEnabled &&
    this.data.availabilities.some((item) => item.hourlyPrice !== null);
  protected readonly modeTabs: readonly ChipOption<RentalMode>[] = [
    { value: 'DAY', labelKey: 'spotSearch.request.modeDay' },
    { value: 'HOUR', labelKey: 'spotSearch.request.modeHour' },
  ];
  protected readonly mode = signal<RentalMode>('DAY');
  protected readonly startDate = signal(this.data.from);
  protected readonly endDate = signal(this.data.to || this.data.from);
  protected readonly vehicles = signal<VehicleListItem[] | null>(null);
  protected readonly submitting = signal(false);
  protected readonly error = inject(ErrorText).state({
    400: 'spotSearch.request.invalid',
    404: 'errors.parkingSpots.notFound',
    409: 'spotSearch.request.conflict',
  });

  protected readonly form = inject(NonNullableFormBuilder).group({
    vehicleId: ['', [Validators.required]],
    startHour: ['8'],
    endHour: ['10'],
  });
  private readonly hours = signal({ start: 8, end: 10 });

  protected readonly vehicleOptions = computed<SelectOption[]>(() =>
    (this.vehicles() ?? []).map((vehicle) => ({
      value: vehicle.id,
      label: [displayPlate(vehicle.plate), vehicle.brand, vehicle.model]
        .filter(Boolean)
        .join(' · '),
      literal: true,
    })),
  );
  protected readonly quote = computed(() =>
    quoteRental(this.data.availabilities, {
      mode: this.mode(),
      startDate: this.startDate(),
      endDate: this.mode() === 'HOUR' ? this.startDate() : this.endDate(),
      startHour: this.hours().start,
      endHour: this.hours().end,
    }),
  );

  constructor() {
    inject(VehiclesApi)
      .list('', 0, 100)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (page) => {
          const own = page.items.filter(
            (vehicle) => vehicle.residency?.condominiumId === this.data.spot.condominiumId,
          );
          this.vehicles.set(own);
          if (own.length === 1) this.form.controls.vehicleId.setValue(own[0].id);
        },
        error: (error: unknown) => {
          this.vehicles.set([]);
          this.error.setFrom(error);
        },
      });
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(({ startHour, endHour }) =>
        this.hours.set({ start: Number(startHour), end: Number(endHour) }),
      );
  }

  protected setStart(value: string): void {
    this.startDate.set(value);
    if (!this.endDate() || this.endDate() < value) this.endDate.set(value);
  }

  protected cancel(): void {
    this.ref.close();
  }

  protected submit(): void {
    if (this.submitting()) return;
    const vehicle = this.vehicles()?.find((item) => item.id === this.form.controls.vehicleId.value);
    if (!vehicle || !this.quote()) {
      this.form.markAllAsTouched();
      return;
    }
    const hourly = this.mode() === 'HOUR';
    const { start: startHour, end: endHour } = this.hours();
    this.submitting.set(true);
    this.error.clear();
    this.rentals
      .create({
        parkingSpotId: this.data.spot.id,
        renterResidentId: vehicle.residentId,
        vehicleId: vehicle.id,
        startDate: this.startDate(),
        endDate: hourly ? this.startDate() : this.endDate(),
        startHour: hourly ? startHour : null,
        endHour: hourly ? endHour : null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.ref.close(true),
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.setFrom(error);
        },
      });
  }
}
