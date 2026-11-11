export type Role = 'ADMIN' | 'CONDOMINIUM_ADMIN' | 'RESIDENT';
export type AccountType = 'RESIDENT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: Role[];
}

export interface Credentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface Registration {
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  accountTypes: AccountType[];
}
