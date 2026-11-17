import { HttpHeaders } from '@angular/common/http';

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  hasNext: boolean;
  total?: number;
}

export function toPage<T>(items: T[], page: number, size: number, total?: number): Page<T> {
  const hasNext = total === undefined ? items.length === size : (page + 1) * size < total;
  return { items, page, size, hasNext, total };
}

export function toResponsePage<T>(
  response: { headers: HttpHeaders },
  items: T[],
  page: number,
  size: number,
): Page<T> {
  const header = response.headers.get('X-Total-Count');
  const total = header === null ? NaN : Number(header);
  return toPage(items, page, size, Number.isInteger(total) ? total : undefined);
}
