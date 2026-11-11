import {
  datePatternFor,
  clampDay,
  daysInMonth,
  displayToIso,
  isoToDisplay,
  maskDate,
  shiftDate,
} from './date-format';

describe('date-format', () => {
  it('escolhe o padrão pelo idioma', () => {
    expect(datePatternFor('pt-BR')).toBe('dd/MM/yyyy');
    expect(datePatternFor('en')).toBe('MM/dd/yyyy');
  });

  it('aplica a máscara só com dígitos', () => {
    expect(maskDate('1a2b3c4d5e6f7g8h9')).toBe('12');
    expect(maskDate('123')).toBe('12');
    expect(maskDate('1202', 'MM/dd/yyyy')).toBe('12/02');
  });

  it('bloqueia dígitos impossíveis enquanto digita', () => {
    expect(maskDate('99999999')).toBe('');
    expect(maskDate('32')).toBe('3');
    expect(maskDate('0')).toBe('0');
    expect(maskDate('00')).toBe('0');
    expect(maskDate('1313')).toBe('13/1');
    expect(maskDate('3002')).toBe('30/02');
    expect(maskDate('0230', 'MM/dd/yyyy')).toBe('02/30');
    expect(maskDate('01011899')).toBe('01/01/199');
    expect(maskDate('01012101')).toBe('01/01/210');
    expect(maskDate('31122100')).toBe('31/12/2100');
  });

  it('converte entre ISO e exibição nos dois padrões', () => {
    expect(isoToDisplay('2026-11-08', 'dd/MM/yyyy')).toBe('08/11/2026');
    expect(isoToDisplay('2026-11-08', 'MM/dd/yyyy')).toBe('11/08/2026');
    expect(displayToIso('08/11/2026', 'dd/MM/yyyy')).toBe('2026-11-08');
    expect(displayToIso('11/08/2026', 'MM/dd/yyyy')).toBe('2026-11-08');
  });

  it('rejeita datas incompletas ou inexistentes', () => {
    expect(displayToIso('31/02/2026', 'dd/MM/yyyy')).toBeNull();
    expect(displayToIso('13/01/2026', 'MM/dd/yyyy')).toBeNull();
    expect(displayToIso('08/11/20', 'dd/MM/yyyy')).toBeNull();
    expect(isoToDisplay('', 'dd/MM/yyyy')).toBe('');
  });

  it('respeita dias por mês e ano bissexto', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(displayToIso('29/02/2028', 'dd/MM/yyyy')).toBe('2028-02-29');
    expect(displayToIso('29/02/2026', 'dd/MM/yyyy')).toBeNull();
    expect(displayToIso('31/04/2026', 'dd/MM/yyyy')).toBeNull();
    expect(displayToIso('00/04/2026', 'dd/MM/yyyy')).toBeNull();
    expect(displayToIso('10/00/2026', 'dd/MM/yyyy')).toBeNull();
  });

  it('leva o dia para o último do mês quando passa do limite', () => {
    expect(clampDay('30/02/2026', 'dd/MM/yyyy')).toBe('28/02/2026');
    expect(clampDay('30/02/2028', 'dd/MM/yyyy')).toBe('29/02/2028');
    expect(clampDay('31/04/2026', 'dd/MM/yyyy')).toBe('30/04/2026');
    expect(clampDay('02/31/2026', 'MM/dd/yyyy')).toBe('02/28/2026');
    expect(clampDay('15/04/2026', 'dd/MM/yyyy')).toBe('15/04/2026');
    expect(clampDay('31/04/20', 'dd/MM/yyyy')).toBe('31/04/20');
  });

  it('limita o ano entre 1900 e 2100', () => {
    expect(displayToIso('01/01/1899', 'dd/MM/yyyy')).toBeNull();
    expect(displayToIso('01/01/0001', 'dd/MM/yyyy')).toBeNull();
    expect(displayToIso('01/01/2101', 'dd/MM/yyyy')).toBeNull();
    expect(displayToIso('01/01/1900', 'dd/MM/yyyy')).toBe('1900-01-01');
    expect(displayToIso('31/12/2100', 'dd/MM/yyyy')).toBe('2100-12-31');
  });

  it('ajusta dia, mês e ano mantendo a data válida', () => {
    expect(shiftDate('2026-02-28', 'day', 1)).toBe('2026-03-01');
    expect(shiftDate('2028-02-28', 'day', 1)).toBe('2028-02-29');
    expect(shiftDate('2026-01-31', 'month', 1)).toBe('2026-02-28');
    expect(shiftDate('2026-12-15', 'month', 1)).toBe('2027-01-15');
    expect(shiftDate('2026-01-15', 'month', -1)).toBe('2025-12-15');
    expect(shiftDate('2028-02-29', 'year', 1)).toBe('2029-02-28');
    expect(shiftDate('2100-06-01', 'year', 1)).toBeNull();
    expect(shiftDate('1900-01-01', 'day', -1)).toBeNull();
    expect(shiftDate('', 'day', 1)).toBeNull();
  });
});
