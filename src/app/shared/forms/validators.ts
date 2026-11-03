import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { formatNameInput, onlyDigits } from './masks';

const PERSON_NAME = /^\p{L}+(?:[ ']\p{L}+)*$/u;

export const personNameValidator: ValidatorFn = (control) => {
  const value = String(control.value ?? '')
    .normalize('NFC')
    .trim();
  return !value || (value.length >= 3 && value.includes(' ') && PERSON_NAME.test(value))
    ? null
    : { personName: true };
};

export const formatPersonName = (value: string): string => formatNameInput(value, true).trim();

export const phoneValidator: ValidatorFn = (control) => {
  const length = onlyDigits(String(control.value ?? '')).length;
  return !control.value || (length >= 10 && length <= 11) ? null : { phone: true };
};

export function sameAs(otherName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    control.value === control.parent?.get(otherName)?.value ? null : { mismatch: true };
}
