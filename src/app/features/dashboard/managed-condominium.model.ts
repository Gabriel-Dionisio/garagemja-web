export const MANAGED_STATUSES = ['ACTIVE', 'PENDING', 'REJECTED', 'BLOCKED', 'CLOSED'] as const;

export type ManagedStatus = (typeof MANAGED_STATUSES)[number];

export interface ManagedCondominium {
  id: string;
  name: string;
  status: ManagedStatus;
  residents: number;
  pendingResidents: number;
  parkingSpots: number;
  activeRentals: number;
  resides: boolean;
}

export function isManagedStatus(value: unknown): value is ManagedStatus {
  return MANAGED_STATUSES.some((status) => status === value);
}
