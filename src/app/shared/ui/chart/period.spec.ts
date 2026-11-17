import { CHART_PERIOD_OPTIONS, isChartPeriod, periodLabels } from './period';

describe('periodLabels', () => {
  it('rotula mês, bimestre e ano a partir do início do período', () => {
    expect(periodLabels(['2026-11'], 'MONTH', 'en')).toEqual(['Nov']);
    expect(periodLabels(['2026-11'], 'BIMESTER', 'en')).toEqual(['Nov–Dec']);
    expect(periodLabels(['2026-01'], 'YEAR', 'pt-BR')).toEqual(['2026']);
  });

  it('valida o período e oferece as três opções com mês primeiro', () => {
    expect(CHART_PERIOD_OPTIONS.map((option) => option.value)).toEqual([
      'MONTH',
      'BIMESTER',
      'YEAR',
    ]);
    expect(isChartPeriod('BIMESTER')).toBe(true);
    expect(isChartPeriod('WEEK')).toBe(false);
  });
});
