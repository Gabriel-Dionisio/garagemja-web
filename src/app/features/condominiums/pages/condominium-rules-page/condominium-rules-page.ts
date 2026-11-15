import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, catchError, finalize, forkJoin, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import {
  formatMoneyInput,
  formatMoneyValue,
  parseMoney,
  positiveMoneyValidator,
} from '../../../../shared/forms/money';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { CondominiumTabs } from '../../../../shared/ui/condominium-tabs/condominium-tabs';
import { CondominiumTabsState } from '../../../../shared/ui/condominium-tabs/condominium-tabs-state';
import { FormActions } from '../../../../shared/ui/form-actions/form-actions';
import { FormSection } from '../../../../shared/ui/form-section/form-section';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { SkeletonBlock } from '../../../../shared/ui/skeleton/skeleton-block';
import { Switch } from '../../../../shared/ui/switch/switch';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Condominium, CondominiumRules } from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';

const digits = (value: string): string => value.replace(/\D/g, '').slice(0, 4);
const toText = (value: number | null): string => (value === null ? '' : String(value));
const toMoney = (value: number | null): string => (value === null ? '' : formatMoneyValue(value));
const toInt = (value: string): number | null => (value ? Number(value) : null);
const toAmount = (value: string): number | null => (value.trim() ? parseMoney(value) : null);

@Component({
  selector: 'app-condominium-rules-page',
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    Alert,
    Button,
    Card,
    CondominiumTabs,
    FormActions,
    FormSection,
    Page,
    PageHeader,
    Skeleton,
    SkeletonBlock,
    Switch,
    TextField,
  ],
  templateUrl: './condominium-rules-page.html',
  styleUrl: './condominium-rules-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumRulesPage {
  private readonly api = inject(CondominiumsApi);
  private readonly tabsState = inject(CondominiumTabsState);

  readonly id = input.required<string>();

  protected readonly digits = digits;
  protected readonly money = formatMoneyInput;
  protected readonly condominium = signal<Condominium | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly saved = signal(false);
  protected readonly hourly = signal(false);
  protected readonly knownName = computed(() => this.tabsState.nameOf(this.id()));
  protected readonly error = inject(ErrorText).state({
    403: 'errors.condominium.forbidden',
    404: 'errors.condominium.notFound',
  });
  protected readonly dirty = signal(false);
  private last: CondominiumRules | null = null;
  private notes: string | null = null;

  protected readonly form = inject(NonNullableFormBuilder).group({
    maxRentalDays: [''],
    minAdvanceHours: [''],
    cancellationDeadlineHours: [''],
    maxPricePerDay: ['', [positiveMoneyValidator]],
    minRentalHours: ['1'],
    maxPricePerHour: ['', [positiveMoneyValidator]],
  });

  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.dirty.set(this.form.dirty));
    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.error.clear();
          return forkJoin({ condominium: this.api.get(id), rules: this.api.rules(id) }).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ condominium, rules }) => {
        this.condominium.set(condominium);
        this.tabsState.set(condominium, false);
        this.fill(rules);
        this.loading.set(false);
      });
  }

  protected save(): void {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const rules: CondominiumRules = {
      maxRentalDays: toInt(value.maxRentalDays),
      minAdvanceHours: toInt(value.minAdvanceHours),
      cancellationDeadlineHours: toInt(value.cancellationDeadlineHours),
      maxPricePerDay: toAmount(value.maxPricePerDay),
      maxPricePerHour: this.hourly() ? toAmount(value.maxPricePerHour) : null,
      minRentalHours: this.hourly() ? (toInt(value.minRentalHours) ?? 1) : 1,
      hourlyRentalsEnabled: this.hourly(),
      notes: this.notes,
    };
    this.busy.set(true);
    this.saved.set(false);
    this.error.clear();
    this.api
      .updateRules(this.id(), rules)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (updated) => {
          this.fill(updated);
          this.saved.set(true);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected setHourly(value: boolean): void {
    this.hourly.set(value);
    this.dirty.set(true);
  }

  protected cancel(): void {
    if (this.last) this.fill(this.last);
  }

  private fill(rules: CondominiumRules): void {
    this.last = rules;
    this.dirty.set(false);
    this.notes = rules.notes;
    this.hourly.set(rules.hourlyRentalsEnabled);
    this.form.reset({
      maxRentalDays: toText(rules.maxRentalDays),
      minAdvanceHours: toText(rules.minAdvanceHours),
      cancellationDeadlineHours: toText(rules.cancellationDeadlineHours),
      maxPricePerDay: toMoney(rules.maxPricePerDay),
      minRentalHours: String(rules.minRentalHours),
      maxPricePerHour: toMoney(rules.maxPricePerHour),
    });
  }
}
