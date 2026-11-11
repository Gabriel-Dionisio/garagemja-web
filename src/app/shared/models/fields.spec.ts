import { fields, isNullableString, textOrNull } from './fields';

describe('fields', () => {
  it('rejeita o que não é objeto', () => {
    expect(() => fields(null, 'user')).toThrow('Invalid user');
    expect(() => fields('x')).toThrow('Invalid data');
  });

  it('devolve os campos do objeto', () => {
    expect(fields({ a: 1 })).toEqual({ a: 1 });
  });

  it('aceita texto, nulo e ausente como texto opcional', () => {
    expect([null, undefined, 'a'].every(isNullableString)).toBe(true);
    expect(isNullableString(1)).toBe(false);
    expect(textOrNull(undefined)).toBeNull();
    expect(textOrNull('a')).toBe('a');
  });
});
