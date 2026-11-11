import { AuditData } from './audit-log.model';

export interface AuditChange {
  field: string;
  before: string;
  after: string;
}

const display = (value: unknown): string =>
  value === undefined || value === null
    ? '—'
    : typeof value === 'string'
      ? value
      : JSON.stringify(value);

export function diffAudit(oldData: AuditData | null, newData: AuditData | null): AuditChange[] {
  const fields = new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})]);
  return [...fields]
    .filter((field) => JSON.stringify(oldData?.[field]) !== JSON.stringify(newData?.[field]))
    .map((field) => ({
      field,
      before: display(oldData?.[field]),
      after: display(newData?.[field]),
    }));
}
