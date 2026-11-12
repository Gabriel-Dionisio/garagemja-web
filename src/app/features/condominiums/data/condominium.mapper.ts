import { fields, isNullableString, textOrNull } from '../../../shared/models/fields';
import {
  Condominium,
  CondominiumContact,
  CondominiumCounts,
  CondominiumImage,
  CondominiumLookup,
  CondominiumRules,
  ManagedCondominium,
} from '../condominium.model';
import { isCondominiumStatus } from '../condominium-status';
import { isResidentStatus } from '../resident-status';

export function toCondominium(value: unknown): Condominium {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid condominium');
  const {
    id,
    name,
    cnpj,
    address,
    district,
    number,
    city,
    state,
    zipCode,
    status,
    statusReason,
    requestedBy,
    canManage,
    resides,
    residency,
    contacts,
    createdAt,
    imageUrl,
    thumbnailUrl,
  } = Object.fromEntries(Object.entries(value));
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    !isCondominiumStatus(status) ||
    typeof canManage !== 'boolean' ||
    typeof createdAt !== 'string' ||
    !isNullableString(cnpj) ||
    !isNullableString(address) ||
    !isNullableString(district) ||
    !isNullableString(number) ||
    !isNullableString(city) ||
    !isNullableString(state) ||
    !isNullableString(zipCode) ||
    !isNullableString(statusReason) ||
    !isNullableString(requestedBy) ||
    !isNullableString(imageUrl) ||
    !isNullableString(thumbnailUrl)
  ) {
    throw new Error('Invalid condominium');
  }
  return {
    id,
    name,
    cnpj: cnpj ?? null,
    address: address ?? null,
    district: district ?? null,
    number: number ?? null,
    city: city ?? null,
    state: state ?? null,
    zipCode: zipCode ?? null,
    status,
    statusReason: statusReason ?? null,
    requestedBy: requestedBy ?? null,
    canManage,
    resides: resides === true,
    residency: toResidencyRef(residency),
    contacts: Array.isArray(contacts) ? contacts.flatMap(toContact) : [],
    createdAt,
    imageUrl: imageUrl ?? null,
    thumbnailUrl: thumbnailUrl ?? null,
  };
}

export function toCondominiumImages(body: unknown): CondominiumImage[] {
  if (!Array.isArray(body)) throw new Error('Invalid images');
  return body.map(toCondominiumImage);
}

export function toCondominiumImage(value: unknown): CondominiumImage {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid image');
  const { id, url } = Object.fromEntries(Object.entries(value));
  if (typeof id !== 'string' || typeof url !== 'string') throw new Error('Invalid image');
  return { id, url };
}

export function toCondominiumCounts(value: unknown): CondominiumCounts {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid counts');
  const { residents, parkingSpots, activeRentals } = Object.fromEntries(Object.entries(value));
  if (
    typeof residents !== 'number' ||
    typeof parkingSpots !== 'number' ||
    typeof activeRentals !== 'number'
  ) {
    throw new Error('Invalid counts');
  }
  return { residents, parkingSpots, activeRentals };
}

export function toManagedCondominium(value: unknown): ManagedCondominium {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid managed condominium');
  const { id, name, city, state, status, pendingResidents, resides } = Object.fromEntries(
    Object.entries(value),
  );
  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    !isNullableString(city) ||
    !isNullableString(state) ||
    !isCondominiumStatus(status) ||
    typeof pendingResidents !== 'number' ||
    typeof resides !== 'boolean'
  ) {
    throw new Error('Invalid managed condominium');
  }
  return {
    ...toCondominiumCounts(value),
    id,
    name,
    city: city ?? null,
    state: state ?? null,
    status,
    pendingResidents,
    resides,
  };
}

function toResidencyRef(value: unknown): Condominium['residency'] {
  if (typeof value !== 'object' || value === null) return null;
  const { id, status, unit, block } = fields(value);
  return typeof id === 'string' && isResidentStatus(status)
    ? { id, status, unit: textOrNull(unit), block: textOrNull(block) }
    : null;
}

function toContact(value: unknown): CondominiumContact[] {
  if (typeof value !== 'object' || value === null) return [];
  const { name, email } = fields(value);
  return typeof name === 'string' ? [{ name, email: textOrNull(email) }] : [];
}

export function toCondominiumLookup(value: unknown): CondominiumLookup {
  const { name, city, state } = fields(value, 'condominium');
  if (typeof name !== 'string' || !name) throw new Error('Invalid condominium');
  return { name, city: textOrNull(city), state: textOrNull(state) };
}

const toNumberOrNull = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

export function toCondominiumRules(value: unknown): CondominiumRules {
  const row = fields(value, 'rules');
  return {
    maxRentalDays: toNumberOrNull(row['maxRentalDays']),
    minAdvanceHours: toNumberOrNull(row['minAdvanceHours']),
    cancellationDeadlineHours: toNumberOrNull(row['cancellationDeadlineHours']),
    maxPricePerDay: toNumberOrNull(row['maxPricePerDay']),
  };
}
