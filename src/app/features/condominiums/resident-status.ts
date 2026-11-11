import { BadgeTone } from '../../shared/ui/badge/badge';
import { ResidentStatus } from './condominium.model';

export const RESIDENT_STATUS_LABELS: Record<ResidentStatus, string> = {
  PENDING: 'condominiums.residencies.status.PENDING',
  APPROVED: 'condominiums.residencies.status.APPROVED',
  REJECTED: 'condominiums.residencies.status.REJECTED',
  BLOCKED: 'condominiums.residencies.status.BLOCKED',
};

export const RESIDENT_STATUS_TONES: Record<ResidentStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  BLOCKED: 'danger',
};

export function isResidentStatus(value: unknown): value is ResidentStatus {
  return typeof value === 'string' && value in RESIDENT_STATUS_LABELS;
}
