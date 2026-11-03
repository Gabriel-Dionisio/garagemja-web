import { ValidatorFn } from '@angular/forms';

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 20;

export const PASSWORD_RULES = [
  {
    key: 'length',
    test: (value: string) => value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX,
  },
  { key: 'lower', test: (value: string) => /[a-z]/.test(value) },
  { key: 'upper', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'digit', test: (value: string) => /\d/.test(value) },
  { key: 'symbol', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value)) && !/[\s\p{Cc}]/u.test(value);
}

export const passwordPolicyValidator: ValidatorFn = (control) =>
  !control.value || isStrongPassword(String(control.value)) ? null : { passwordPolicy: true };
