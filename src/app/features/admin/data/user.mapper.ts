import { textOrNull } from '../../../shared/models/fields';
import { isRole } from '../../../core/auth/role';
import { User } from '../user.model';
import { isUserStatus } from '../user-status';

export function toUser(value: unknown): User {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid user');
  const { id, name, email, phone, cpf, roles, status } = Object.fromEntries(Object.entries(value));
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    !Array.isArray(roles) ||
    !roles.every(isRole) ||
    !isUserStatus(status)
  ) {
    throw new Error('Invalid user');
  }
  return { id, name, email, phone: textOrNull(phone), cpf: textOrNull(cpf), roles, status };
}
