import { ValidatorFn } from '@angular/forms';

const MONEY = /^\d{1,8}(,\d{1,2})?$/;

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function formatMoneyInput(value: string): string {
  const normalized = !value.includes(',') && value.endsWith('.') ? `${value.slice(0, -1)},` : value;
  const [whole, ...rest] = normalized.replace(/[^\d,]/g, '').split(',');
  const integer = groupThousands(whole.replace(/^0+(?=\d)/, '').slice(0, 8));
  return rest.length === 0 ? integer : `${integer},${rest.join('').slice(0, 2)}`;
}

export function parseMoney(value: string): number | null {
  const text = value.trim().replaceAll('.', '');
  return MONEY.test(text) ? Number(text.replace(',', '.')) : null;
}

export function formatMoneyValue(value: number): string {
  const [integer, cents] = value.toFixed(2).split('.');
  return `${groupThousands(integer)},${cents}`;
}

export const positiveMoneyValidator: ValidatorFn = (control) => {
  const text = String(control.value ?? '').trim();
  if (!text) return null;
  const amount = parseMoney(text);
  return amount !== null && amount > 0 ? null : { money: true };
};
