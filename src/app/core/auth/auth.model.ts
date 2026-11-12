export type Role = 'ADMIN' | 'CONDOMINIUM_ADMIN' | 'RESIDENT';
export type AccountType = 'RESIDENT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  photoUrl: string | null;
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

export type LoginOutcome =
  { kind: 'authenticated'; user: UserProfile } | { kind: 'second-factor'; challenge: string };
