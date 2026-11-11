export function fields(value: unknown, what = 'data'): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) throw new Error(`Invalid ${what}`);
  return Object.fromEntries(Object.entries(value));
}

export function isNullableString(value: unknown): value is string | null | undefined {
  return value === null || value === undefined || typeof value === 'string';
}

export const textOrNull = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;
