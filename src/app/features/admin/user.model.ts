import { Role } from '../../core/auth/auth.model';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  roles: Role[];
  status: UserStatus;
}

export interface UserFilter {
  email: string;
  cpf: string;
  status?: UserStatus;
}

export interface AdminDraft {
  name: string;
  email: string;
  password: string;
}

export interface UserChanges {
  name?: string;
  phone?: string;
  status?: UserStatus;
}
