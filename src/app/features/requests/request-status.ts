import { BadgeTone } from '../../shared/ui/badge/badge';
import { RentalStatus } from './owned-rental.model';

export const REQUEST_STATUSES: readonly RentalStatus[] = [
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'REFUSED',
  'CANCELED',
  'FINISHED',
  'EXPIRED',
];

export const REQUEST_TONES: Record<RentalStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'info',
  ACTIVE: 'success',
  REFUSED: 'danger',
  CANCELED: 'danger',
  FINISHED: 'neutral',
  EXPIRED: 'neutral',
};

export function isRequestStatus(value: unknown): value is RentalStatus {
  return REQUEST_STATUSES.some((status) => status === value);
}
