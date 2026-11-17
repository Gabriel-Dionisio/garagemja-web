import { RENTAL_STATUSES, RentalStatus } from '../models/rental-status';

export { RENTAL_STATUSES, type RentalStatus } from '../models/rental-status';

export interface Rental {
  id: string;
  condominiumName: string;
  parkingSpotId: string | null;
  parkingSpotNumber: string;
  startDate: string;
  endDate: string;
  startHour: number | null;
  endHour: number | null;
  price: number;
  total: number;
  payable: number;
  paid: boolean;
  paymentPending: boolean;
  status: RentalStatus;
  cancelReason: string | null;
}

export function isRentalStatus(value: unknown): value is RentalStatus {
  return RENTAL_STATUSES.some((status) => status === value);
}

export interface CancellationPreview {
  refundAmount: number;
  penalty: number;
  late: boolean;
}
