import { BadgeTone } from '../ui/badge/badge';

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

export const RENTAL_STATUS_TONES: Record<RentalStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'info',
  ACTIVE: 'success',
  REFUSED: 'danger',
  CANCELED: 'danger',
  FINISHED: 'neutral',
  EXPIRED: 'neutral',
};
