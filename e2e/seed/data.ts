import { cpfFromBase } from '../support/real-api.ts';
import { SEED_DOMAIN } from './config.ts';

export const emailOf = (role: string, n = 1) => `seed.${role}.${n}@${SEED_DOMAIN}`;

export function cpfFor(index: number): string {
  const base = [...String((index * 987_654_321 + 123_456_789) % 1_000_000_000).padStart(9, '0')].map(Number);
  return cpfFromBase(base.every((d) => d === base[0]) ? [1, ...base.slice(1)] : base);
}

export function cnpjFor(index: number): string {
  const base = String(10_000_000 + index * 1_117).padStart(8, '0') + '0001';
  const digits = [...base].map(Number);
  const check = (weights: number[]) => {
    const rest = digits.reduce((sum, d, i) => sum + d * weights[i], 0) % 11;
    digits.push(rest < 2 ? 0 : 11 - rest);
  };
  check([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  check([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.join('');
}

export type CondoStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED' | 'CLOSED';
export type ResidentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Account { email: string; name: string; cpfIndex: number; role: string; note: string }
export interface Condo { key: string; name: string; cnpj: string; requester: string; target: CondoStatus; reason?: string }
export interface Resident { account: string; condo: string; via: 'code' | 'cnpj'; unit: string; block?: string; target: ResidentStatus }

const account = (role: string, n: number, name: string, cpfIndex: number, note: string): Account =>
  ({ email: emailOf(role, n), name, cpfIndex, role, note });

export const ACCOUNTS: Account[] = [
  account('admin', 1, 'Seed Admin Um', 1, 'ADMIN (promoted via SQL)'),
  account('manager', 1, 'Seed Sindico Um', 2, 'Sindico of the ACTIVE condominium; has an open invite out'),
  account('resident', 1, 'Seed Morador Um', 3, 'Resident PENDING (join by code)'),
  account('resident', 2, 'Seed Morador Dois', 4, 'Resident APPROVED (join by code)'),
  account('resident', 3, 'Seed Morador Tres', 5, 'Resident REJECTED (join by code)'),
  account('resident', 4, 'Seed Morador Quatro', 6, 'Resident PENDING (join by CNPJ)'),
  account('resident', 5, 'Seed Morador Cinco', 13, 'Resident APPROVED (renter with vehicle and rentals)'),
  account('requester', 1, 'Seed Solicitante Um', 7, 'Owns a PENDING condominium'),
  account('requester', 2, 'Seed Solicitante Dois', 8, 'Owns a REJECTED condominium'),
  account('requester', 3, 'Seed Solicitante Tres', 9, 'Sindico of a BLOCKED condominium'),
  account('requester', 4, 'Seed Solicitante Quatro', 10, 'Ex-sindico of a CLOSED condominium'),
  account('nolink', 1, 'Seed Sem Vinculo', 11, 'No link (welcome screen)'),
  account('invitee', 1, 'Seed Convidado Um', 12, 'Has an open sindico invite'),
];

export const CONDOS: Condo[] = [
  { key: 'active', name: 'Residencial Seed Ativo', cnpj: cnpjFor(1), requester: emailOf('manager'), target: 'ACTIVE' },
  { key: 'pending', name: 'Residencial Seed Pendente', cnpj: cnpjFor(2), requester: emailOf('requester', 1), target: 'PENDING' },
  { key: 'rejected', name: 'Residencial Seed Rejeitado', cnpj: cnpjFor(3), requester: emailOf('requester', 2), target: 'REJECTED', reason: 'Seed: documents not provided' },
  { key: 'blocked', name: 'Residencial Seed Bloqueado', cnpj: cnpjFor(4), requester: emailOf('requester', 3), target: 'BLOCKED', reason: 'Seed: blocked for review' },
  { key: 'closed', name: 'Residencial Seed Encerrado', cnpj: cnpjFor(5), requester: emailOf('requester', 4), target: 'CLOSED', reason: 'Seed: activity ended' },
];

export const RESIDENTS: Resident[] = [
  { account: emailOf('resident', 1), condo: 'active', via: 'code', unit: '101', block: 'A', target: 'PENDING' },
  { account: emailOf('resident', 2), condo: 'active', via: 'code', unit: '102', block: 'A', target: 'APPROVED' },
  { account: emailOf('resident', 3), condo: 'active', via: 'code', unit: '201', block: 'B', target: 'REJECTED' },
  { account: emailOf('resident', 4), condo: 'active', via: 'cnpj', unit: '202', target: 'PENDING' },
  { account: emailOf('resident', 5), condo: 'active', via: 'code', unit: '301', block: 'C', target: 'APPROVED' },
];

export type SpotSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type RentalTarget = 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELED';
export interface Spot { key: string; condo: string; number: string; location: string; size: SpotSize; owner?: string; price: number }
export interface Vehicle { owner: string; plate: string; brand: string; model: string; color: string }
export interface Rental { spot: string; renter: string; plate: string; startOffset: number; endOffset: number; target: RentalTarget; reason?: string }

export const AVAILABILITY_DAYS = 180;

export const dateIn = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const SPOTS: Spot[] = [
  { key: 'a-01', condo: 'active', number: 'A-01', location: 'Subsolo 1', size: 'MEDIUM', owner: emailOf('resident', 2), price: 8 },
  { key: 'a-02', condo: 'active', number: 'A-02', location: 'Subsolo 1', size: 'SMALL', owner: emailOf('resident', 2), price: 6 },
  { key: 'b-01', condo: 'active', number: 'B-01', location: 'Terreo', size: 'LARGE', price: 12 },
];

export const VEHICLES: Vehicle[] = [
  { owner: emailOf('resident', 5), plate: 'ABC1D23', brand: 'Fiat', model: 'Argo', color: 'Prata' },
  { owner: emailOf('resident', 2), plate: 'DEF4567', brand: 'Honda', model: 'Civic', color: 'Preto' },
];

export const RENTALS: Rental[] = [
  { spot: 'a-01', renter: emailOf('resident', 5), plate: 'ABC1D23', startOffset: 10, endOffset: 12, target: 'PENDING' },
  { spot: 'a-01', renter: emailOf('resident', 5), plate: 'ABC1D23', startOffset: 20, endOffset: 22, target: 'APPROVED' },
  { spot: 'a-01', renter: emailOf('resident', 5), plate: 'ABC1D23', startOffset: 30, endOffset: 32, target: 'REFUSED' },
  { spot: 'a-01', renter: emailOf('resident', 5), plate: 'ABC1D23', startOffset: 40, endOffset: 42, target: 'CANCELED', reason: 'Seed: plans changed' },
];

export const STATUS_PATH: Record<CondoStatus, CondoStatus[]> = {
  PENDING: [],
  ACTIVE: ['ACTIVE'],
  REJECTED: ['REJECTED'],
  BLOCKED: ['ACTIVE', 'BLOCKED'],
  CLOSED: ['ACTIVE', 'CLOSED'],
};
