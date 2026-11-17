export function moneyFormatter(language: string): (value: number) => string {
  const format = new Intl.NumberFormat(language, { style: 'currency', currency: 'BRL' });
  return (value) => format.format(value);
}

export function dateFormatter(language: string): (iso: string) => string {
  const format = new Intl.DateTimeFormat(language, { timeZone: 'UTC' });
  return (iso) => format.format(new Date(`${iso}T00:00:00Z`));
}

export function dateTimeFormatter(language: string): (iso: string) => string {
  const format = new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short' });
  return (iso) => format.format(new Date(iso));
}

export interface PeriodInput {
  startDate: string;
  endDate: string;
  startHour: number | null;
  endHour: number | null;
}

export interface PeriodText {
  key: string;
  params: Record<string, string | number>;
}

export function periodText(period: PeriodInput, language: string): PeriodText {
  const short = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const day = (iso: string) => short.format(new Date(`${iso}T00:00:00Z`));
  if (period.startHour !== null && period.endHour !== null) {
    return {
      key: 'rentals.period.hours',
      params: { date: day(period.startDate), start: period.startHour, end: period.endHour },
    };
  }
  const count =
    Math.round(
      (Date.parse(`${period.endDate}T00:00:00Z`) - Date.parse(`${period.startDate}T00:00:00Z`)) /
        86_400_000,
    ) + 1;
  return {
    key: 'rentals.period.days',
    params: { start: day(period.startDate), end: day(period.endDate), count },
  };
}
