import { Role } from '../../core/auth/auth.model';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  roles: Role[];
  status: UserStatus;
}

export interface UsersSummary {
  total: number;
  active: number;
  pending: number;
  blocked: number;
}

export interface UserFilter {
  email: string;
  cpf: string;
  status?: UserStatus;
}

export interface UserDraft {
  name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  roles: Role[];
}

export interface UserChanges {
  name?: string;
  phone?: string;
  status?: UserStatus;
  roles?: Role[];
}
