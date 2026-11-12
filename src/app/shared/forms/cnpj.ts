import { ValidatorFn } from '@angular/forms';
import { onlyCnpj } from './masks';

const WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function checkDigit(chars: string, length: number): number {
  const weights = WEIGHTS.slice(WEIGHTS.length - length);
  const sum = [...chars.slice(0, length)].reduce(
    (total, char, index) => total + (char.charCodeAt(0) - 48) * weights[index],
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value: string): boolean {
  const chars = onlyCnpj(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars) || /^(.)\1{13}$/.test(chars)) return false;
  return checkDigit(chars, 12) === Number(chars[12]) && checkDigit(chars, 13) === Number(chars[13]);
}

export const cnpjValidator: ValidatorFn = (control) =>
  !control.value || isValidCnpj(String(control.value)) ? null : { cnpj: true };
