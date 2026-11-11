import { MonthlyPoint } from './stats-api';

export function monthLabels(points: readonly MonthlyPoint[], locale: string): string[] {
  const format = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  return points.map((point) => format.format(new Date(`${point.month}-01T00:00:00Z`)));
}
