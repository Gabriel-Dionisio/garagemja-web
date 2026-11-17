import {
  RENTAL_STATUSES,
  RENTAL_STATUS_TONES,
  RentalStatus,
} from '../../shared/models/rental-status';

export const REQUEST_STATUSES: readonly RentalStatus[] = RENTAL_STATUSES;

export const REQUEST_TONES = RENTAL_STATUS_TONES;

export function isRequestStatus(value: unknown): value is RentalStatus {
  return REQUEST_STATUSES.some((status) => status === value);
}
