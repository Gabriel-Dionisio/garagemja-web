import { cpfFromBase } from '../support/real-api.ts';
import { SEED_DOMAIN } from './config.ts';

export const emailOf = (role: string, n = 1) => `seed.${role}.${n}@${SEED_DOMAIN}`;

export function cpfFor(index: number): string {
  const base = [
    ...String((index * 987_654_321 + 123_456_789) % 1_000_000_000).padStart(9, '0'),
  ].map(Number);
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

export interface Account {
  email: string;
  name: string;
  cpfIndex: number;
  role: string;
  note: string;
}
export interface Condo {
  key: string;
  name: string;
  cnpj: string;
  requester: string;
  target: CondoStatus;
  reason?: string;
}
export interface Resident {
  account: string;
  condo: string;
  via: 'code' | 'cnpj';
  unit: string;
  block?: string;
  target: ResidentStatus;
}

const account = (
  role: string,
  n: number,
  name: string,
  cpfIndex: number,
  note: string,
): Account => ({ email: emailOf(role, n), name, cpfIndex, role, note });

export const ACCOUNTS: Account[] = [
  account('admin', 1, 'Seed Admin Um', 1, 'ADMIN (promoted via SQL; no CPF)'),
  account(
    'manager',
    1,
    'Seed Sindico Um',
    2,
    'Sindico of the ACTIVE condominium; has an open invite out',
  ),
  account('resident', 1, 'Seed Morador Um', 3, 'Resident PENDING (join by code)'),
  account('resident', 2, 'Seed Morador Dois', 4, 'Resident APPROVED (owns A-01/A-02; rents B-02)'),
  account('resident', 3, 'Seed Morador Tres', 5, 'Resident REJECTED (join by code)'),
  account('resident', 4, 'Seed Morador Quatro', 6, 'Resident PENDING (join by CNPJ)'),
  account(
    'resident',
    5,
    'Seed Morador Cinco',
    13,
    'Resident APPROVED (renter with vehicle; owns B-02 and blocked C-03)',
  ),
  account(
    'resident',
    6,
    'Seed Morador Seis',
    15,
    'Resident APPROVED in the second condominium; owns J-01',
  ),
  account(
    'resident',
    7,
    'Seed Morador Sete',
    16,
    'Resident APPROVED in the second condominium; renter',
  ),
  account(
    'manager',
    2,
    'Seed Sindico Dois',
    14,
    'Sindico of the second ACTIVE condominium (daily only, 12h advance)',
  ),
  account('requester', 1, 'Seed Solicitante Um', 7, 'Owns a PENDING condominium'),
  account('requester', 2, 'Seed Solicitante Dois', 8, 'Owns a REJECTED condominium'),
  account('requester', 3, 'Seed Solicitante Tres', 9, 'Sindico of a BLOCKED condominium'),
  account('requester', 4, 'Seed Solicitante Quatro', 10, 'Ex-sindico of a CLOSED condominium'),
  account('nolink', 1, 'Seed Sem Vinculo', 11, 'No link (welcome screen); no phone'),
  account('invitee', 1, 'Seed Convidado Um', 12, 'Has an open sindico invite'),
];

export const CONDOS: Condo[] = [
  {
    key: 'active',
    name: 'Residencial Seed Ativo',
    cnpj: cnpjFor(1),
    requester: emailOf('manager'),
    target: 'ACTIVE',
  },
  {
    key: 'garden',
    name: 'Residencial Seed Jardim',
    cnpj: cnpjFor(6),
    requester: emailOf('manager', 2),
    target: 'ACTIVE',
  },
  {
    key: 'pending',
    name: 'Residencial Seed Pendente',
    cnpj: cnpjFor(2),
    requester: emailOf('requester', 1),
    target: 'PENDING',
  },
  {
    key: 'rejected',
    name: 'Residencial Seed Rejeitado',
    cnpj: cnpjFor(3),
    requester: emailOf('requester', 2),
    target: 'REJECTED',
    reason: 'Seed: documents not provided',
  },
  {
    key: 'blocked',
    name: 'Residencial Seed Bloqueado',
    cnpj: cnpjFor(4),
    requester: emailOf('requester', 3),
    target: 'BLOCKED',
    reason: 'Seed: blocked for review',
  },
  {
    key: 'closed',
    name: 'Residencial Seed Encerrado',
    cnpj: cnpjFor(5),
    requester: emailOf('requester', 4),
    target: 'CLOSED',
    reason: 'Seed: activity ended',
  },
];

export const RESIDENTS: Resident[] = [
  {
    account: emailOf('resident', 1),
    condo: 'active',
    via: 'code',
    unit: '101',
    block: 'A',
    target: 'PENDING',
  },
  {
    account: emailOf('resident', 2),
    condo: 'active',
    via: 'code',
    unit: '102',
    block: 'A',
    target: 'APPROVED',
  },
  {
    account: emailOf('resident', 3),
    condo: 'active',
    via: 'code',
    unit: '201',
    block: 'B',
    target: 'REJECTED',
  },
  { account: emailOf('resident', 4), condo: 'active', via: 'cnpj', unit: '202', target: 'PENDING' },
  {
    account: emailOf('resident', 5),
    condo: 'active',
    via: 'code',
    unit: '301',
    block: 'C',
    target: 'APPROVED',
  },
  {
    account: emailOf('resident', 6),
    condo: 'garden',
    via: 'code',
    unit: '11',
    block: 'J',
    target: 'APPROVED',
  },
  {
    account: emailOf('resident', 7),
    condo: 'garden',
    via: 'cnpj',
    unit: '12',
    block: 'J',
    target: 'APPROVED',
  },
];

export type SpotSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type RentalTarget =
  'PENDING' | 'APPROVED' | 'ACTIVE' | 'FINISHED' | 'REFUSED' | 'CANCELED' | 'EXPIRED';
export type SpotTarget = 'PENDING' | 'REJECTED' | 'BLOCKED';
export interface Rule {
  maxRentalDays?: number;
  minAdvanceHours?: number;
  cancellationDeadlineHours?: number;
  maxPricePerDay?: number;
  maxPricePerHour?: number;
  minRentalHours: number;
  hourlyRentalsEnabled: boolean;
  notes: string;
}
export interface Period {
  dailyPrice?: number;
  hourlyPrice?: number;
  hourlyFrom?: number;
  hourlyTo?: number;
  startOffset: number;
  endOffset: number;
  active?: boolean;
}
export interface Spot {
  key: string;
  condo: string;
  number: string;
  location: string;
  size: SpotSize;
  owner?: string;
  periods?: Period[];
  target?: SpotTarget;
  reason?: string;
}
export interface Vehicle {
  owner: string;
  condo: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
}
export interface Rental {
  spot: string;
  renter: string;
  plate: string;
  startOffset: number;
  endOffset: number;
  startHour?: number;
  endHour?: number;
  target: RentalTarget;
  reason?: string;
}

export const dateIn = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const RULES: Record<string, Rule> = {
  active: {
    maxRentalDays: 15,
    cancellationDeadlineHours: 24,
    maxPricePerDay: 60,
    maxPricePerHour: 10,
    minRentalHours: 2,
    hourlyRentalsEnabled: true,
    notes: 'Aluguel por hora liberado das 7h as 22h. Cancelamento ate 24h antes.',
  },
  garden: {
    maxRentalDays: 7,
    minAdvanceHours: 12,
    cancellationDeadlineHours: 48,
    maxPricePerDay: 40,
    minRentalHours: 1,
    hourlyRentalsEnabled: false,
    notes: 'Somente diarias, com 12h de antecedencia.',
  },
};

export const SPOTS: Spot[] = [
  {
    key: 'a-01',
    condo: 'active',
    number: 'A-01',
    location: 'Subsolo 1',
    size: 'MEDIUM',
    owner: emailOf('resident', 2),
    periods: [
      {
        dailyPrice: 30,
        hourlyPrice: 6,
        hourlyFrom: 7,
        hourlyTo: 22,
        startOffset: -15,
        endOffset: 60,
      },
      { dailyPrice: 35, startOffset: 61, endOffset: 90, active: false },
    ],
  },
  {
    key: 'a-02',
    condo: 'active',
    number: 'A-02',
    location: 'Subsolo 1',
    size: 'SMALL',
    owner: emailOf('resident', 2),
    periods: [{ hourlyPrice: 5, hourlyFrom: 8, hourlyTo: 18, startOffset: -15, endOffset: 180 }],
  },
  {
    key: 'b-01',
    condo: 'active',
    number: 'B-01',
    location: 'Terreo',
    size: 'LARGE',
    periods: [{ dailyPrice: 45, startOffset: 1, endOffset: 180 }],
  },
  {
    key: 'b-02',
    condo: 'active',
    number: 'B-02',
    location: 'Terreo',
    size: 'MEDIUM',
    owner: emailOf('resident', 5),
    periods: [{ dailyPrice: 25, hourlyPrice: 4, startOffset: 1, endOffset: 120 }],
  },
  {
    key: 'c-01',
    condo: 'active',
    number: 'C-01',
    location: 'Subsolo 2',
    size: 'SMALL',
    owner: emailOf('resident', 2),
    target: 'PENDING',
  },
  {
    key: 'c-02',
    condo: 'active',
    number: 'C-02',
    location: 'Subsolo 2',
    size: 'SMALL',
    owner: emailOf('resident', 2),
    target: 'REJECTED',
    reason: 'Seed: spot not found',
  },
  {
    key: 'c-03',
    condo: 'active',
    number: 'C-03',
    location: 'Subsolo 2',
    size: 'MEDIUM',
    owner: emailOf('resident', 5),
    target: 'BLOCKED',
    reason: 'Seed: maintenance in the garage',
  },
  {
    key: 'j-01',
    condo: 'garden',
    number: 'J-01',
    location: 'Garagem coberta',
    size: 'MEDIUM',
    owner: emailOf('resident', 6),
    periods: [{ dailyPrice: 35, startOffset: 1, endOffset: 120 }],
  },
  {
    key: 'j-02',
    condo: 'garden',
    number: 'J-02',
    location: 'Garagem descoberta',
    size: 'LARGE',
    periods: [{ dailyPrice: 30, startOffset: 1, endOffset: 120 }],
  },
];

export const VEHICLES: Vehicle[] = [
  {
    owner: emailOf('resident', 5),
    condo: 'active',
    plate: 'ABC1D23',
    brand: 'Fiat',
    model: 'Argo',
    color: 'Prata',
  },
  {
    owner: emailOf('resident', 2),
    condo: 'active',
    plate: 'DEF4567',
    brand: 'Honda',
    model: 'Civic',
    color: 'Preto',
  },
  {
    owner: emailOf('resident', 7),
    condo: 'garden',
    plate: 'GHI2J45',
    brand: 'Volkswagen',
    model: 'Polo',
    color: 'Branco',
  },
];

const r5 = { renter: emailOf('resident', 5), plate: 'ABC1D23' };
const r2 = { renter: emailOf('resident', 2), plate: 'DEF4567' };
const r7 = { renter: emailOf('resident', 7), plate: 'GHI2J45' };

export const RENTALS: Rental[] = [
  { spot: 'a-01', ...r5, startOffset: 10, endOffset: 12, target: 'PENDING' },
  { spot: 'a-01', ...r5, startOffset: 20, endOffset: 22, target: 'APPROVED' },
  { spot: 'a-01', ...r5, startOffset: 30, endOffset: 32, target: 'REFUSED' },
  {
    spot: 'a-01',
    ...r5,
    startOffset: 40,
    endOffset: 42,
    target: 'CANCELED',
    reason: 'Seed: plans changed',
  },
  { spot: 'a-01', ...r5, startOffset: -1, endOffset: 2, target: 'ACTIVE' },
  { spot: 'a-01', ...r5, startOffset: -10, endOffset: -8, target: 'FINISHED' },
  { spot: 'a-01', ...r5, startOffset: -4, endOffset: -3, target: 'EXPIRED' },
  {
    spot: 'a-02',
    ...r5,
    startOffset: 3,
    endOffset: 3,
    startHour: 10,
    endHour: 13,
    target: 'PENDING',
  },
  {
    spot: 'a-02',
    ...r5,
    startOffset: 5,
    endOffset: 5,
    startHour: 14,
    endHour: 17,
    target: 'APPROVED',
  },
  {
    spot: 'a-02',
    ...r5,
    startOffset: -2,
    endOffset: -2,
    startHour: 9,
    endHour: 12,
    target: 'FINISHED',
  },
  {
    spot: 'b-02',
    ...r2,
    startOffset: 2,
    endOffset: 2,
    startHour: 19,
    endHour: 21,
    target: 'PENDING',
  },
  { spot: 'b-02', ...r2, startOffset: 7, endOffset: 9, target: 'APPROVED' },
  { spot: 'b-01', ...r2, startOffset: 14, endOffset: 15, target: 'REFUSED' },
  { spot: 'j-01', ...r7, startOffset: 5, endOffset: 6, target: 'PENDING' },
  { spot: 'j-01', ...r7, startOffset: 14, endOffset: 16, target: 'APPROVED' },
  { spot: 'j-02', ...r7, startOffset: 3, endOffset: 4, target: 'REFUSED' },
];

export const STATUS_PATH: Record<CondoStatus, CondoStatus[]> = {
  PENDING: [],
  ACTIVE: ['ACTIVE'],
  REJECTED: ['REJECTED'],
  BLOCKED: ['ACTIVE', 'BLOCKED'],
  CLOSED: ['ACTIVE', 'CLOSED'],
};

export const RENTAL_PATH: Record<RentalTarget, RentalTarget[]> = {
  PENDING: [],
  EXPIRED: [],
  APPROVED: ['APPROVED'],
  REFUSED: ['REFUSED'],
  CANCELED: ['APPROVED', 'CANCELED'],
  ACTIVE: ['APPROVED', 'ACTIVE'],
  FINISHED: ['APPROVED', 'ACTIVE', 'FINISHED'],
};
