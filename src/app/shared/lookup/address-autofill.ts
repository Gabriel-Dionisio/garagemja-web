import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { defer, distinctUntilChanged, filter, finalize, map, switchMap, tap } from 'rxjs';
import { formatCep, formatNameInput, formatUf, onlyCnpj, onlyDigits } from '../forms/masks';
import { BrazilLookup } from './brazil-lookup';

type Text = FormControl<string>;

export interface AutofillControls {
  name: Text;
  cnpj: Text;
  zipCode: Text;
  address: Text;
  district: Text;
  number: Text;
  city: Text;
  state: Text;
}

export interface Autofill {
  readonly busy: Signal<boolean>;
  readonly inactiveCnpj: Signal<boolean>;
}

const isEmpty = (control: AbstractControl<string>): boolean => !control.value.trim();

const fit = (value: string, max: number): string => value.slice(0, max);

export function autofillCondominium(form: FormGroup<AutofillControls>): Autofill {
  const lookup = inject(BrazilLookup);
  const destroyRef = inject(DestroyRef);
  const pending = signal(0);
  const busy = signal(false);
  const inactiveCnpj = signal(false);
  const { name, cnpj, zipCode, address, district, number, city, state } = form.controls;

  const track = <T>(task: () => Promise<T>) =>
    defer(() => {
      pending.update((count) => count + 1);
      busy.set(true);
      return task();
    }).pipe(
      finalize(() => {
        const left = pending() - 1;
        pending.set(left);
        busy.set(left > 0);
      }),
    );

  const fill = (control: Text, value: string, max: number, overwrite: boolean) => {
    if (value && (overwrite || isEmpty(control))) control.setValue(fit(value, max));
  };

  cnpj.valueChanges
    .pipe(
      filter(() => cnpj.dirty),
      map((value) => onlyCnpj(value)),
      distinctUntilChanged(),
      tap(() => inactiveCnpj.set(false)),
      filter((chars) => chars.length === 14 && cnpj.valid),
      switchMap((chars) => track(() => lookup.cnpj(chars))),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe((data) => {
      if (!data) return;
      inactiveCnpj.set(!data.active);
      fill(name, formatNameInput(data.name, true), 150, false);
      fill(address, data.address, 255, false);
      fill(number, data.number, 20, false);
      fill(district, data.district, 100, false);
      fill(city, data.city, 100, false);
      fill(state, formatUf(data.state), 2, false);
      if (isEmpty(zipCode)) zipCode.setValue(formatCep(data.zipCode));
    });

  zipCode.valueChanges
    .pipe(
      filter(() => zipCode.dirty),
      map((value) => onlyDigits(value)),
      distinctUntilChanged(),
      filter((digits) => digits.length === 8),
      switchMap((digits) => track(() => lookup.cep(digits))),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe((data) => {
      if (!data) return;
      fill(address, data.address, 255, true);
      fill(district, data.district, 100, true);
      fill(city, data.city, 100, true);
      fill(state, formatUf(data.state), 2, true);
    });

  return { busy: busy.asReadonly(), inactiveCnpj: inactiveCnpj.asReadonly() };
}
