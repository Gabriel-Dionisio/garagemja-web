import { Role } from './auth.model';

export const ROLES: readonly Role[] = ['ADMIN', 'CONDOMINIUM_ADMIN', 'RESIDENT'];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'common.roles.ADMIN',
  CONDOMINIUM_ADMIN: 'common.roles.CONDOMINIUM_ADMIN',
  RESIDENT: 'common.roles.RESIDENT',
};

export function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}
