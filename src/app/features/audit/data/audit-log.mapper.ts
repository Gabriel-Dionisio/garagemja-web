import { AuditData, AuditLog, isAuditAction, isAuditEntityType } from '../audit-log.model';

function toData(value: unknown): AuditData | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid audit data');
  return Object.fromEntries(Object.entries(value));
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new Error('Invalid audit log');
  return value;
}

export function toAuditLog(value: unknown): AuditLog {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid audit log');
  const record = Object.fromEntries(Object.entries(value));
  const { id, entityType, entityId, action, createdAt } = record;
  if (
    typeof id !== 'string' ||
    !isAuditEntityType(entityType) ||
    typeof entityId !== 'string' ||
    !isAuditAction(action) ||
    typeof createdAt !== 'string'
  ) {
    throw new Error('Invalid audit log');
  }
  return {
    id,
    entityType,
    entityId,
    action,
    createdAt,
    condominiumId: toNullableString(record['condominiumId']),
    userId: toNullableString(record['userId']),
    oldData: toData(record['oldData']),
    newData: toData(record['newData']),
  };
}
