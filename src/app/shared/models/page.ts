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
