import { isRentalStatus, RentalRecord } from '../rental.model';

interface ParkingSpotDetails {
  id: string;
  number: string;
  location: string | null;
}

interface CondominiumDetails {
  id: string;
  name: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid rental response: ${key}`);
  }
  return value;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function toResidentIds(value: unknown, userId: string): string[] {
  if (!Array.isArray(value)) throw new Error('Invalid resident list response');
  return value.map((item) => {
    if (!isRecord(item) || item['userId'] !== userId) {
      throw new Error('Invalid resident response');
    }
    return requiredString(item, 'id');
  });
}

export function toRentalRecords(value: unknown): RentalRecord[] {
  if (!Array.isArray(value)) throw new Error('Invalid rental list response');
  return value.map((item) => {
    if (!isRecord(item)) throw new Error('Invalid rental response');

    const startDate = requiredString(item, 'startDate');
    const endDate = requiredString(item, 'endDate');
    const createdAt = requiredString(item, 'createdAt');
    const price = item['price'];
    const status = item['status'];

    if (
      !isDate(startDate) ||
      !isDate(endDate) ||
      !Number.isFinite(Date.parse(createdAt)) ||
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price < 0 ||
      !isRentalStatus(status)
    ) {
      throw new Error('Invalid rental response');
    }

    return {
      id: requiredString(item, 'id'),
      condominiumId: requiredString(item, 'condominiumId'),
      parkingSpotId: requiredString(item, 'parkingSpotId'),
      renterResidentId: requiredString(item, 'renterResidentId'),
      startDate,
      endDate,
      price,
      status,
      createdAt,
    };
  });
}

export function toParkingSpotDetails(value: unknown, expectedId: string): ParkingSpotDetails {
  if (!isRecord(value) || value['id'] !== expectedId) {
    throw new Error('Invalid parking spot response');
  }
  const location = value['location'];
  if (location !== null && location !== undefined && typeof location !== 'string') {
    throw new Error('Invalid parking spot response: location');
  }
  return {
    id: expectedId,
    number: requiredString(value, 'number'),
    location: typeof location === 'string' ? location : null,
  };
}

export function toCondominiumDetails(value: unknown, expectedId: string): CondominiumDetails {
  if (!isRecord(value) || value['id'] !== expectedId) {
    throw new Error('Invalid condominium response');
  }
  return {
    id: expectedId,
    name: requiredString(value, 'name'),
  };
}
