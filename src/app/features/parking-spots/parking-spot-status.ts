import { BadgeTone } from '../../shared/ui/badge/badge';
import {
  PARKING_SPOT_SIZES,
  ParkingSpot,
  PARKING_SPOT_STATUSES,
  ParkingSpotSize,
  ParkingSpotStatus,
  SpotAvailability,
  SpotRules,
} from './parking-spot.model';

export const PARKING_SPOT_STATUS_LABELS: Record<ParkingSpotStatus, string> = {
  PENDING: 'parkingSpots.status.PENDING',
  ACTIVE: 'parkingSpots.status.ACTIVE',
  REJECTED: 'parkingSpots.status.REJECTED',
  BLOCKED: 'parkingSpots.status.BLOCKED',
};

export const PARKING_SPOT_STATUS_TONES: Record<ParkingSpotStatus, BadgeTone> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  REJECTED: 'danger',
  BLOCKED: 'danger',
};

export const PARKING_SPOT_SIZE_LABELS: Record<ParkingSpotSize, string> = {
  SMALL: 'parkingSpots.size.SMALL',
  MEDIUM: 'parkingSpots.size.MEDIUM',
  LARGE: 'parkingSpots.size.LARGE',
};

export function isParkingSpotStatus(value: unknown): value is ParkingSpotStatus {
  return PARKING_SPOT_STATUSES.some((status) => status === value);
}

export function isParkingSpotSize(value: unknown): value is ParkingSpotSize {
  return PARKING_SPOT_SIZES.some((size) => size === value);
}

export interface SpotBadge {
  labelKey: string;
  tone: BadgeTone;
}

export function spotBadge(spot: ParkingSpot): SpotBadge {
  if (spot.status !== 'ACTIVE') {
    return {
      labelKey: PARKING_SPOT_STATUS_LABELS[spot.status],
      tone: PARKING_SPOT_STATUS_TONES[spot.status],
    };
  }
  return spot.availability
    ? { labelKey: 'parkingSpots.badge.available', tone: 'success' }
    : { labelKey: 'parkingSpots.badge.unavailable', tone: 'neutral' };
}

export function aboveCap(availability: SpotAvailability, rules: SpotRules): boolean {
  const { maxPricePerDay, maxPricePerHour } = rules;
  const daily =
    maxPricePerDay !== null &&
    availability.dailyPrice !== null &&
    availability.dailyPrice > maxPricePerDay;
  const hourly =
    maxPricePerHour !== null &&
    availability.hourlyPrice !== null &&
    availability.hourlyPrice > maxPricePerHour;
  return daily || hourly;
}
