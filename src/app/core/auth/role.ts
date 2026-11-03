import { AccountType, Role } from './auth.model';

export const ROLES: readonly Role[] = ['ADMIN', 'CONDOMINIUM_ADMIN', 'RESIDENT'];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'common.roles.ADMIN',
  CONDOMINIUM_ADMIN: 'common.roles.CONDOMINIUM_ADMIN',
  RESIDENT: 'common.roles.RESIDENT',
};

export const ACCOUNT_TYPES: readonly AccountType[] = ['RESIDENT', 'CONDOMINIUM_ADMIN'];

export function isAccountType(value: unknown): value is AccountType {
  return ACCOUNT_TYPES.some((type) => type === value);
}

export function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}
