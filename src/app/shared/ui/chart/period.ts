import { ChipOption } from '../chip-group/chip-group';

export const CHART_PERIODS = ['MONTH', 'BIMESTER', 'YEAR'] as const;
export type ChartPeriod = (typeof CHART_PERIODS)[number];

export const CHART_PERIOD_OPTIONS: readonly ChipOption<ChartPeriod>[] = CHART_PERIODS.map(
  (value) => ({ value, labelKey: `charts.period.${value}` }),
);

export function isChartPeriod(value: unknown): value is ChartPeriod {
  return CHART_PERIODS.some((period) => period === value);
}

export function periodLabels(
  starts: readonly string[],
  period: ChartPeriod,
  locale: string,
): string[] {
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  return starts.map((start) => {
    const date = new Date(`${start}-01T00:00:00Z`);
    if (period === 'YEAR') return String(date.getUTCFullYear());
    if (period === 'MONTH') return month.format(date);
    const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    return `${month.format(date)}–${month.format(next)}`;
  });
}
