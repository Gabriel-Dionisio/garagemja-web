export const RENTAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'REFUSED',
  'CANCELED',
  'FINISHED',
] as const;

export type RentalStatus = (typeof RENTAL_STATUSES)[number];
export type RentalTab = 'active' | 'requests' | 'history';

export interface RentalRecord {
  id: string;
  condominiumId: string;
  parkingSpotId: string;
  renterResidentId: string;
  startDate: string;
  endDate: string;
  price: number;
  status: RentalStatus;
  createdAt: string;
}

export interface RentalCard extends RentalRecord {
  parkingSpotNumber: string;
  parkingSpotLocation: string | null;
  condominiumName: string;
}

export function isRentalStatus(value: unknown): value is RentalStatus {
  return RENTAL_STATUSES.some((status) => status === value);
}

export function isRentalRequest(status: RentalStatus): boolean {
  return status === 'PENDING' || status === 'APPROVED';
}

export function isHistoricalRental(status: RentalStatus): boolean {
  return status === 'REFUSED' || status === 'CANCELED' || status === 'FINISHED';
}
