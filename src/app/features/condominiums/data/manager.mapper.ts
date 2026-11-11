import { fields } from '../../../shared/models/fields';
import { Manager, ManagerInvite } from '../condominium.model';

export function toList<T>(body: unknown, mapper: (value: unknown) => T): T[] {
  if (!Array.isArray(body)) throw new Error('Invalid list');
  return body.map(mapper);
}

export function toManager(value: unknown): Manager {
  const { userId, name, email, showEmail } = fields(value);
  if (typeof userId !== 'string' || typeof name !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid manager');
  }
  return { userId, name, email, showEmail: showEmail === true };
}

export function toManagerInvite(value: unknown): ManagerInvite {
  const { id, condominiumId, condominiumName, invitedEmail, requested, expiresAt } = fields(value);
  if (
    typeof id !== 'string' ||
    typeof condominiumId !== 'string' ||
    typeof condominiumName !== 'string' ||
    typeof invitedEmail !== 'string' ||
    typeof expiresAt !== 'string'
  ) {
    throw new Error('Invalid manager invite');
  }
  return {
    id,
    condominiumId,
    condominiumName,
    invitedEmail,
    requested: requested === true,
    expiresAt,
  };
}
