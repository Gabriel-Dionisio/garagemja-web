export const WALLET_TYPES = ['OWNER', 'CONDOMINIUM', 'PLATFORM'] as const;
export type WalletType = (typeof WALLET_TYPES)[number];

export const ENTRY_KINDS = [
  'RENTAL_CREDIT',
  'RENTAL_REVERSAL',
  'PENALTY_CREDIT',
  'WITHDRAWAL',
] as const;
export type WalletEntryKind = (typeof ENTRY_KINDS)[number];

export interface WalletSummary {
  type: WalletType;
  refId: string;
  name: string | null;
  available: number;
  pending: number;
}

export interface WalletEntry {
  id: string;
  kind: WalletEntryKind;
  amount: number;
  availableAt: string;
  released: boolean;
  rentalId: string | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  type: WalletType;
  refId: string;
  amount: number;
  pixKey: string;
}

export interface WalletFlowPoint {
  start: string;
  credits: number;
  debits: number;
}
