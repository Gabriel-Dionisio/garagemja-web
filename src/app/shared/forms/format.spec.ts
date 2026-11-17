import { dateFormatter, instantDateFormatter, moneyFormatter, periodText } from './format';

describe('format', () => {
  it('formata moeda em reais e data ISO sem deslocar o dia pelo fuso', () => {
    expect(moneyFormatter('pt-BR')(8.5).replace(/\s/g, ' ')).toBe('R$ 8,50');
    expect(dateFormatter('pt-BR')('2030-01-01')).toBe('01/01/2030');
  });

  it('formata data de instante conforme o idioma', () => {
    expect(instantDateFormatter('pt-BR')('2030-06-15T12:00:00Z')).toBe('15/06/2030');
    expect(instantDateFormatter('en')('2030-06-15T12:00:00Z')).toBe('6/15/30');
  });

  it('descreve período por horas ou por dias inclusivos', () => {
    const hours = periodText(
      { startDate: '2030-03-05', endDate: '2030-03-05', startHour: 8, endHour: 12 },
      'pt-BR',
    );
    expect(hours.key).toBe('rentals.period.hours');
    expect(hours.params).toMatchObject({ start: 8, end: 12 });

    const days = periodText(
      { startDate: '2030-02-27', endDate: '2030-03-02', startHour: null, endHour: null },
      'pt-BR',
    );
    expect(days).toMatchObject({ key: 'rentals.period.days', params: { count: 4 } });
  });
});
