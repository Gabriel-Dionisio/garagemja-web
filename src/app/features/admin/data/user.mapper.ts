import { isRole } from '../../../core/auth/role';
import { User, UsersSummary } from '../user.model';
import { isUserStatus } from '../user-status';

export function toUser(value: unknown): User {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid user');
  const { id, name, email, phone, cpf, roles, status } = Object.fromEntries(Object.entries(value));
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof phone !== 'string' ||
    typeof cpf !== 'string' ||
    !Array.isArray(roles) ||
    !roles.every(isRole) ||
    !isUserStatus(status)
  ) {
    throw new Error('Invalid user');
  }
  return { id, name, email, phone, cpf, roles, status };
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

export function toUsersSummary(value: unknown): UsersSummary {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid summary');
  const { total, active, pending, blocked } = Object.fromEntries(Object.entries(value));
  if (!isInteger(total) || !isInteger(active) || !isInteger(pending) || !isInteger(blocked)) {
    throw new Error('Invalid summary');
  }
  return { total, active, pending, blocked };
}
