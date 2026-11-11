import { fields, textOrNull as text } from '../../../shared/models/fields';
import { JoinPreview, ResidentMember } from '../condominium.model';
import { isResidentStatus } from '../resident-status';

export function toJoinPreview(value: unknown): JoinPreview {
  const { condominiumId, name, city, state } = fields(value);
  if (typeof condominiumId !== 'string' || typeof name !== 'string') {
    throw new Error('Invalid join preview');
  }
  return { condominiumId, name, city: text(city), state: text(state) };
}

export function toResidentMember(value: unknown): ResidentMember {
  const { id, userId, name, email, unit, block, status, emailVerified } = fields(value);
  if (
    typeof id !== 'string' ||
    typeof userId !== 'string' ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    !isResidentStatus(status)
  ) {
    throw new Error('Invalid resident');
  }
  return {
    id,
    userId,
    name,
    email,
    unit: text(unit),
    block: text(block),
    status,
    emailVerified: emailVerified !== false,
  };
}

export function toJoinCode(value: unknown): string {
  const { code } = fields(value);
  if (typeof code !== 'string') throw new Error('Invalid join code');
  return code;
}
