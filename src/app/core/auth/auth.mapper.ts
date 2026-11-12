import { UserProfile } from './auth.model';
import { isRole } from './role';

export function toUserProfile(value: unknown): UserProfile {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid profile');
  const data = Object.fromEntries(Object.entries(value));
  const { id, name, email, roles, photoUrl } = data;
  if (
    typeof id !== 'string' ||
    !id ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    !Array.isArray(roles) ||
    roles.length === 0 ||
    !roles.every(isRole)
  ) {
    throw new Error('Invalid profile');
  }
  return { id, name, email, roles, photoUrl: typeof photoUrl === 'string' ? photoUrl : null };
}
