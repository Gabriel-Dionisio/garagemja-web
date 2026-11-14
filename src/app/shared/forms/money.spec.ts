import { FormControl } from '@angular/forms';
import { formatMoneyInput, formatMoneyValue, parseMoney, positiveMoneyValidator } from './money';

describe('money', () => {
  it('formata ao digitar', () => {
    expect(formatMoneyInput('12.5')).toBe('12,5');
    expect(formatMoneyInput('1,234')).toBe('1,23');
    expect(formatMoneyInput('1,2,3')).toBe('1,23');
    expect(formatMoneyInput('abc9')).toBe('9');
    expect(formatMoneyInput('1234567890')).toBe('12345678');
  });

  it('converte texto em número e de volta', () => {
    expect(parseMoney('8,50')).toBe(8.5);
    expect(parseMoney('8')).toBe(8);
    expect(parseMoney('8,')).toBeNull();
    expect(parseMoney('')).toBeNull();
    expect(formatMoneyValue(8)).toBe('8,00');
  });

  it('valida valor positivo, aceitando vazio', () => {
    expect(positiveMoneyValidator(new FormControl(''))).toBeNull();
    expect(positiveMoneyValidator(new FormControl('0'))).toEqual({ money: true });
    expect(positiveMoneyValidator(new FormControl('5,5'))).toBeNull();
  });
});
