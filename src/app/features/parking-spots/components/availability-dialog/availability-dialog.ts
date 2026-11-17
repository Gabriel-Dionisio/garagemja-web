import { TranslocoPipe } from '@jsverse/transloco';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { todayIso } from '../../../../shared/forms/date-format';
import {
  formatMoneyInput,
  formatMoneyValue,
  parseMoney,
  positiveMoneyValidator,
} from '../../../../shared/forms/money';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { DateField } from '../../../../shared/ui/date-field/date-field';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { SelectField, SelectOption } from '../../../../shared/ui/select-field/select-field';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { moneyFormatter } from '../../../../shared/forms/format';
import {
  SpotAvailability,
  SpotAvailabilityInput,
  SpotRules,
} from '../../../../shared/spots/parking-spot.model';

export interface AvailabilityDialogData {
  rules: SpotRules;
  availability: SpotAvailability | null;
}

const hourOptions = (from: number, to: number): SelectOption[] =>
  Array.from({ length: to - from + 1 }, (_, index) => {
    const hour = String(from + index);
    return { value: hour, label: `${hour}h`, literal: true };
  });

@Component({
  selector: 'app-availability-dialog',
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    Alert,
    Button,
    DateField,
    FormActions,
    FormSection,
    SelectField,
    TextField,
  ],
  templateUrl: './availability-dialog.html',
  styleUrl: './availability-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityDialog {
  protected readonly data = inject<AvailabilityDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<SpotAvailabilityInput>>(DialogRef);
  private readonly locale = inject(LocaleService);

  protected readonly formatMoney = formatMoneyInput;
  protected readonly today = todayIso();
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly fromOptions = hourOptions(0, 23);
  protected readonly toOptions = hourOptions(1, 24);
  protected readonly editing = this.data.availability !== null;
  protected readonly hourly = this.data.rules.hourlyRentalsEnabled;
  protected readonly startDate = signal(this.data.availability?.startDate ?? '');
  protected readonly endDate = signal(this.data.availability?.endDate ?? '');
  protected readonly datesInvalid = signal(false);
  protected readonly windowInvalid = signal(false);
  protected readonly priceMissing = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    dailyPrice: [
      this.data.availability?.dailyPrice == null
        ? ''
        : formatMoneyValue(this.data.availability.dailyPrice),
      [positiveMoneyValidator],
    ],
    hourlyPrice: [
      this.data.availability?.hourlyPrice == null
        ? ''
        : formatMoneyValue(this.data.availability.hourlyPrice),
      [positiveMoneyValidator],
    ],
    hourlyFrom: [String(this.data.availability?.hourlyFrom ?? 0)],
    hourlyTo: [String(this.data.availability?.hourlyTo ?? 24)],
  });

  protected setStart(value: string): void {
    this.startDate.set(value);
    this.datesInvalid.set(false);
  }

  protected setEnd(value: string): void {
    this.endDate.set(value);
    this.datesInvalid.set(false);
  }

  protected cancel(): void {
    this.ref.close();
  }

  protected submit(): void {
    const start = this.startDate();
    const end = this.endDate();
    const raw = this.form.getRawValue();
    const from = Number(raw.hourlyFrom);
    const to = Number(raw.hourlyTo);
    const hourlyPrice = this.hourly ? parseMoney(raw.hourlyPrice) : null;
    const datesInvalid = !start || !end || end < start;
    const windowInvalid = hourlyPrice !== null && to <= from;
    this.datesInvalid.set(datesInvalid);
    this.windowInvalid.set(windowInvalid);
    const dailyPrice = parseMoney(raw.dailyPrice);
    const priceMissing = dailyPrice === null && hourlyPrice === null;
    this.priceMissing.set(priceMissing);
    if (this.form.invalid || datesInvalid || windowInvalid || priceMissing) {
      this.form.markAllAsTouched();
      return;
    }
    this.ref.close({
      dailyPrice,
      hourlyPrice,
      hourlyFrom: hourlyPrice === null ? 0 : from,
      hourlyTo: hourlyPrice === null ? 24 : to,
      startDate: start,
      endDate: end,
    });
  }
}
