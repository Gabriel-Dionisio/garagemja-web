import { ValidatorFn } from '@angular/forms';

const MONEY = /^\d{1,8}(,\d{1,2})?$/;

export function formatMoneyInput(value: string): string {
  const cleaned = value.replace('.', ',').replace(/[^\d,]/g, '');
  const [whole, ...rest] = cleaned.split(',');
  const integer = whole.slice(0, 8);
  return rest.length === 0 ? integer : `${integer},${rest.join('').slice(0, 2)}`;
}

export function parseMoney(value: string): number | null {
  const text = value.trim();
  return MONEY.test(text) ? Number(text.replace(',', '.')) : null;
}

export function formatMoneyValue(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export const positiveMoneyValidator: ValidatorFn = (control) => {
  const text = String(control.value ?? '').trim();
  if (!text) return null;
  const amount = parseMoney(text);
  return amount !== null && amount > 0 ? null : { money: true };
};
