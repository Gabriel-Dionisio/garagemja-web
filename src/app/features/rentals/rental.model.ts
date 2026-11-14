export const RENTAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'REFUSED',
  'CANCELED',
  'FINISHED',
  'EXPIRED',
] as const;

export type RentalStatus = (typeof RENTAL_STATUSES)[number];

export interface Rental {
  id: string;
  condominiumName: string;
  parkingSpotNumber: string;
  startDate: string;
  endDate: string;
  startHour: number | null;
  endHour: number | null;
  price: number;
  total: number;
  status: RentalStatus;
}

export function isRentalStatus(value: unknown): value is RentalStatus {
  return RENTAL_STATUSES.some((status) => status === value);
}
