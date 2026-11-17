import { FormControl } from '@angular/forms';
import { formatMoneyInput, formatMoneyValue, parseMoney, positiveMoneyValidator } from './money';

describe('money', () => {
  it('formata ao digitar', () => {
    expect(formatMoneyInput('12.')).toBe('12,');
    expect(formatMoneyInput('1,234')).toBe('1,23');
    expect(formatMoneyInput('1,2,3')).toBe('1,23');
    expect(formatMoneyInput('abc9')).toBe('9');
    expect(formatMoneyInput('1234567890')).toBe('12.345.678');
  });

  it('agrupa milhares sem confundir o próprio separador com decimal', () => {
    expect(formatMoneyInput('1234,5')).toBe('1.234,5');
    expect(formatMoneyInput('1.2345')).toBe('12.345');
    expect(formatMoneyInput('012')).toBe('12');
    expect(formatMoneyInput('0,5')).toBe('0,5');
    expect(formatMoneyInput('1.23')).toBe('123');
    expect(parseMoney('1.234,56')).toBe(1234.56);
    expect(formatMoneyValue(1234.5)).toBe('1.234,50');
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
