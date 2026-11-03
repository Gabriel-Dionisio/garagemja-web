import { UserStatus } from './user.model';

export const STATUS_LABELS: Record<UserStatus, string> = {
  PENDING: 'common.status.PENDING',
  ACTIVE: 'common.status.ACTIVE',
  BLOCKED: 'common.status.BLOCKED',
  INACTIVE: 'common.status.INACTIVE',
};

export function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === 'string' && value in STATUS_LABELS;
}
