import { isValidCnpj } from './cnpj';
import { formatCep, formatCnpj } from './masks';

describe('cnpj', () => {
  it('validates numeric and alphanumeric CNPJ', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('formats CNPJ and CEP', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(formatCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(formatCep('01310100')).toBe('01310-100');
  });
});
