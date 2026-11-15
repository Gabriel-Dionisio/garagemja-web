import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { todayIso } from '../../../../shared/forms/date-format';
import { formatMoneyInput, formatMoneyValue, parseMoney } from '../../../../shared/forms/money';
import { Button } from '../../../../shared/ui/button/button';
import { DateField } from '../../../../shared/ui/date-field/date-field';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { VacancyCriteria } from '../../search-vacancies.model';

export type VacancyFilterValue = Pick<
  VacancyCriteria,
  'search' | 'from' | 'to' | 'minPrice' | 'maxPrice'
>;

@Component({
  selector: 'app-vacancy-filter',
  imports: [TranslocoPipe, ReactiveFormsModule, Button, DateField, TextField],
  templateUrl: './vacancy-filter.html',
  styleUrl: './vacancy-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VacancyFilter {
  readonly criteria = input.required<VacancyCriteria>();
  readonly applied = output<VacancyFilterValue>();

  protected readonly today = todayIso();
  protected readonly formatMoney = formatMoneyInput;
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly form = inject(NonNullableFormBuilder).group({
    search: [''],
    minPrice: [''],
    maxPrice: [''],
  });

  constructor() {
    effect(() => {
      const { search, from, to, minPrice, maxPrice } = this.criteria();
      this.form.setValue({
        search,
        minPrice: minPrice === null ? '' : formatMoneyValue(minPrice),
        maxPrice: maxPrice === null ? '' : formatMoneyValue(maxPrice),
      });
      this.from.set(from);
      this.to.set(to);
    });
  }

  protected setFrom(value: string): void {
    this.from.set(value);
    if (this.to() && this.to() < value) this.to.set(value);
  }

  protected apply(): void {
    const { search, minPrice, maxPrice } = this.form.getRawValue();
    const from = this.from();
    this.applied.emit({
      search: search.trim(),
      from,
      to: from ? this.to() || from : '',
      minPrice: parseMoney(minPrice),
      maxPrice: parseMoney(maxPrice),
    });
  }

  protected clear(): void {
    this.applied.emit({ search: '', from: '', to: '', minPrice: null, maxPrice: null });
  }
}
