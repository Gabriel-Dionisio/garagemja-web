import { ValidatorFn } from '@angular/forms';

const PLATE = /^[A-Z]{3}[0-9](?:[0-9]{3}|[A-Z][0-9]{2})$/;

export function formatPlate(value: string): string {
  return value
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 7);
}

export const plateValidator: ValidatorFn = (control) => {
  const value = String(control.value ?? '');
  return !value || PLATE.test(value) ? null : { plate: true };
};

export function displayPlate(plate: string): string {
  return /^[A-Z]{3}[0-9]{4}$/.test(plate) ? `${plate.slice(0, 3)}-${plate.slice(3)}` : plate;
}
