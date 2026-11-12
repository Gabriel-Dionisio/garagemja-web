import { onlyDigits } from '../../shared/forms/masks';
import { formatPersonName } from '../../shared/forms/validators';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  photoUrl: string | null;
}

export interface ProfileChanges {
  name?: string;
  phone?: string;
}

export function profileChanges(current: Profile, name: string, phone: string): ProfileChanges {
  const next = { name: formatPersonName(name), phone: onlyDigits(phone) };
  return {
    ...(current.name !== next.name ? { name: next.name } : {}),
    ...(next.phone && current.phone !== next.phone ? { phone: next.phone } : {}),
  };
}
