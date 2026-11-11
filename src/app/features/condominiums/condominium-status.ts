import { BadgeTone } from '../../shared/ui/badge/badge';
import { CondominiumStatus } from './condominium.model';

export const CONDOMINIUM_STATUS_LABELS: Record<CondominiumStatus, string> = {
  PENDING: 'condominiums.status.PENDING',
  ACTIVE: 'condominiums.status.ACTIVE',
  REJECTED: 'condominiums.status.REJECTED',
  BLOCKED: 'condominiums.status.BLOCKED',
  CLOSED: 'condominiums.status.CLOSED',
};

export const CONDOMINIUM_STATUS_TONES: Record<CondominiumStatus, BadgeTone> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  REJECTED: 'danger',
  BLOCKED: 'danger',
  CLOSED: 'neutral',
};

export function isCondominiumStatus(value: unknown): value is CondominiumStatus {
  return typeof value === 'string' && value in CONDOMINIUM_STATUS_LABELS;
}
