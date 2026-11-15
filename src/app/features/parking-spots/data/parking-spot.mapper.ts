import { fields, textOrNull as text } from '../../../shared/models/fields';
import { isParkingSpotSize, isParkingSpotStatus } from '../parking-spot-status';
import {
  ParkingSpot,
  ParkingSpotAvailabilitySummary,
  ParkingSpotCondominium,
  ParkingSpotImage,
  ParkingSpotOwner,
  ParkingSpotResidency,
  SpotAvailability,
  SpotRules,
} from '../parking-spot.model';

const numberOrNull = (value: unknown): number | null => (typeof value === 'number' ? value : null);

function toOwner(value: unknown): ParkingSpotOwner | null {
  if (value === null || value === undefined) return null;
  const { residentId, name, unit, block, photoUrl } = fields(value, 'parking spot owner');
  if (typeof residentId !== 'string' || typeof name !== 'string') {
    throw new Error('Invalid parking spot owner');
  }
  return { residentId, name, unit: text(unit), block: text(block), photoUrl: text(photoUrl) };
}

function toAvailabilitySummary(value: unknown): ParkingSpotAvailabilitySummary | null {
  if (value === null || value === undefined) return null;
  const { dailyPrice, hourlyPrice, startDate, endDate } = fields(value, 'availability');
  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    throw new Error('Invalid availability');
  }
  return {
    dailyPrice: numberOrNull(dailyPrice),
    hourlyPrice: numberOrNull(hourlyPrice),
    startDate,
    endDate,
  };
}

export function toParkingSpot(value: unknown): ParkingSpot {
  const raw = fields(value, 'parking spot');
  const { id, condominiumId, number, status } = raw;
  if (
    typeof id !== 'string' ||
    typeof condominiumId !== 'string' ||
    typeof number !== 'string' ||
    !isParkingSpotStatus(status)
  ) {
    throw new Error('Invalid parking spot');
  }
  return {
    id,
    condominiumId,
    number,
    status,
    ownerResidentId: text(raw['ownerResidentId']),
    owner: toOwner(raw['owner']),
    condominiumName: text(raw['condominiumName']),
    availability: toAvailabilitySummary(raw['availability']),
    location: text(raw['location']),
    size: isParkingSpotSize(raw['size']) ? raw['size'] : null,
    statusReason: text(raw['statusReason']),
    imageUrl: text(raw['imageUrl']),
    thumbnailUrl: text(raw['thumbnailUrl']),
  };
}

export function toParkingSpotCondominium(value: unknown): ParkingSpotCondominium {
  const { id, name, status, canManage } = fields(value, 'condominium');
  if (typeof id !== 'string' || typeof name !== 'string' || typeof status !== 'string') {
    throw new Error('Invalid condominium');
  }
  return { id, name, status, canManage: canManage === true };
}

export function toParkingSpotImages(value: unknown): ParkingSpotImage[] {
  if (!Array.isArray(value)) throw new Error('Invalid images');
  return value.map((item) => {
    const { id, url } = fields(item, 'image');
    if (typeof id !== 'string' || typeof url !== 'string') throw new Error('Invalid image');
    return { id, url };
  });
}

export function toSpotAvailability(value: unknown): SpotAvailability {
  const {
    id,
    parkingSpotId,
    dailyPrice,
    hourlyPrice,
    hourlyFrom,
    hourlyTo,
    startDate,
    endDate,
    active,
  } = fields(value, 'availability');
  if (
    typeof id !== 'string' ||
    typeof parkingSpotId !== 'string' ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string'
  ) {
    throw new Error('Invalid availability');
  }
  return {
    id,
    parkingSpotId,
    dailyPrice: numberOrNull(dailyPrice),
    hourlyPrice: numberOrNull(hourlyPrice),
    hourlyFrom: typeof hourlyFrom === 'number' ? hourlyFrom : 0,
    hourlyTo: typeof hourlyTo === 'number' ? hourlyTo : 24,
    startDate,
    endDate,
    active: active === true,
  };
}

export function toSpotRules(value: unknown): SpotRules {
  const row = fields(value, 'rules');
  return {
    maxPricePerDay: numberOrNull(row['maxPricePerDay']),
    maxPricePerHour: numberOrNull(row['maxPricePerHour']),
    hourlyRentalsEnabled: row['hourlyRentalsEnabled'] === true,
  };
}

export function toParkingSpotResidency(value: unknown): ParkingSpotResidency {
  const { condominiumId, condominiumName, status } = fields(value, 'residency');
  if (typeof condominiumId !== 'string' || typeof condominiumName !== 'string') {
    throw new Error('Invalid residency');
  }
  return { condominiumId, condominiumName, approved: status === 'APPROVED' };
}
