import { ValidatorFn } from '@angular/forms';
import { onlyDigits } from './masks';

function cpfCheckDigit(digits: string, length: number): number {
  const sum = [...digits.slice(0, length)].reduce(
    (total, digit, index) => total + Number(digit) * (length + 1 - index),
    0,
  );
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  return (
    cpfCheckDigit(digits, 9) === Number(digits[9]) &&
    cpfCheckDigit(digits, 10) === Number(digits[10])
  );
}

export const cpfValidator: ValidatorFn = (control) =>
  !control.value || isValidCpf(String(control.value)) ? null : { cpf: true };
