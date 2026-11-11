export const AUDIT_ENTITY_TYPES = [
  'CONDOMINIUM',
  'CONDOMINIUM_RULE',
  'USER',
  'RESIDENT',
  'MANAGER',
  'MANAGER_INVITE',
  'JOIN_CODE',
  'PARKING_SPOT',
  'SPOT_AVAILABILITY',
  'VEHICLE',
  'RENTAL',
] as const;
export const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'TRANSFER'] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditData = Record<string, unknown>;

export interface AuditLog {
  id: string;
  condominiumId: string | null;
  userId: string | null;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  oldData: AuditData | null;
  newData: AuditData | null;
  createdAt: string;
}

export interface AuditLogFilter {
  entityType?: AuditEntityType;
  action?: AuditAction;
  entityId?: string;
  userId?: string;
  condominiumId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export function isAuditEntityType(value: unknown): value is AuditEntityType {
  return AUDIT_ENTITY_TYPES.some((type) => type === value);
}

export function isAuditAction(value: unknown): value is AuditAction {
  return AUDIT_ACTIONS.some((action) => action === value);
}
