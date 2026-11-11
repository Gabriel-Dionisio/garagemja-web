import { Language } from '../../core/i18n/locale-service';

export type DatePattern = 'dd/MM/yyyy' | 'MM/dd/yyyy';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function datePatternFor(language: Language): DatePattern {
  return language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
}

export function isoToDisplay(iso: string, pattern: DatePattern): string {
  const match = ISO.exec(iso);
  if (!match) return '';
  const [, year, month, day] = match;
  return pattern === 'MM/dd/yyyy' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

export type DatePart = 'day' | 'month' | 'year';

export interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function toIso({ year, month, day }: DateParts): string {
  const pad = (value: number, size = 2) => String(value).padStart(size, '0');
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function parseIso(iso: string): DateParts | null {
  const match = ISO.exec(iso);
  if (!match) return null;
  const parts = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const valid =
    parts.year >= MIN_YEAR &&
    parts.year <= MAX_YEAR &&
    parts.month >= 1 &&
    parts.month <= 12 &&
    parts.day >= 1 &&
    parts.day <= daysInMonth(parts.year, parts.month);
  return valid ? parts : null;
}

export function displayToIso(text: string, pattern: DatePattern): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [first, second, year] = [match[1], match[2], match[3]];
  const [month, day] = pattern === 'MM/dd/yyyy' ? [first, second] : [second, first];
  const iso = `${year}-${month}-${day}`;
  return parseIso(iso) ? iso : null;
}

export function todayIso(now = new Date()): string {
  return toIso({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}

export function shiftDate(iso: string, part: DatePart, delta: number): string | null {
  const current = parseIso(iso);
  if (!current) return null;
  if (part === 'day') {
    const moved = new Date(Date.UTC(current.year, current.month - 1, current.day + delta));
    return parseIso(
      toIso({
        year: moved.getUTCFullYear(),
        month: moved.getUTCMonth() + 1,
        day: moved.getUTCDate(),
      }),
    )
      ? toIso({
          year: moved.getUTCFullYear(),
          month: moved.getUTCMonth() + 1,
          day: moved.getUTCDate(),
        })
      : null;
  }
  const index = part === 'month' ? current.year * 12 + current.month - 1 + delta : 0;
  const year = part === 'month' ? Math.floor(index / 12) : current.year + delta;
  const month = part === 'month' ? (index % 12) + 1 : current.month;
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return toIso({ year, month, day: Math.min(current.day, daysInMonth(year, month)) });
}

type Segment = 'day' | 'month';

function segmentAccepts(text: string, kind: Segment): boolean {
  if (text.length === 1) return kind === 'day' ? /[0-3]/.test(text) : /[01]/.test(text);
  const value = Number(text);
  return value >= 1 && value <= (kind === 'day' ? 31 : 12);
}

function yearAccepts(prefix: string): boolean {
  for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
    if (String(year).startsWith(prefix)) return true;
  }
  return false;
}

export function maskDate(value: string, pattern: DatePattern = 'dd/MM/yyyy'): string {
  const [kindA, kindB]: Segment[] = pattern === 'MM/dd/yyyy' ? ['month', 'day'] : ['day', 'month'];
  let first = '';
  let second = '';
  let year = '';
  for (const digit of value.replace(/\D/g, '')) {
    if (first.length < 2) {
      if (segmentAccepts(first + digit, kindA)) first += digit;
    } else if (second.length < 2) {
      if (segmentAccepts(second + digit, kindB)) second += digit;
    } else if (year.length < 4 && yearAccepts(year + digit)) {
      year += digit;
    }
  }
  return [first, second, year].filter(Boolean).join('/');
}

export function clampDay(text: string, pattern: DatePattern): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return text;
  const monthFirst = pattern === 'MM/dd/yyyy';
  const month = Number(monthFirst ? match[1] : match[2]);
  const day = Number(monthFirst ? match[2] : match[1]);
  const year = Number(match[3]);
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1) return text;
  const clamped = String(Math.min(day, daysInMonth(year, month))).padStart(2, '0');
  return monthFirst ? `${match[1]}/${clamped}/${match[3]}` : `${clamped}/${match[2]}/${match[3]}`;
}
