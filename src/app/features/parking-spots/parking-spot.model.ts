export const PARKING_SPOT_STATUSES = ['PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED'] as const;
export type ParkingSpotStatus = (typeof PARKING_SPOT_STATUSES)[number];

export const PARKING_SPOT_SIZES = ['SMALL', 'MEDIUM', 'LARGE'] as const;
export type ParkingSpotSize = (typeof PARKING_SPOT_SIZES)[number];

export interface ParkingSpotOwner {
  residentId: string;
  name: string;
  unit: string | null;
  block: string | null;
  photoUrl: string | null;
}

export interface ParkingSpotAvailabilitySummary {
  dailyPrice: number | null;
  hourlyPrice: number | null;
  startDate: string;
  endDate: string;
}

export interface ParkingSpot {
  id: string;
  condominiumId: string;
  ownerResidentId: string | null;
  owner: ParkingSpotOwner | null;
  condominiumName: string | null;
  availability: ParkingSpotAvailabilitySummary | null;
  number: string;
  location: string | null;
  size: ParkingSpotSize | null;
  status: ParkingSpotStatus;
  statusReason: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

export interface ParkingSpotCondominium {
  id: string;
  name: string;
  status: string;
  canManage: boolean;
}

export interface ParkingSpotImage {
  id: string;
  url: string;
}

export interface SpotAvailability {
  id: string;
  parkingSpotId: string;
  dailyPrice: number | null;
  hourlyPrice: number | null;
  hourlyFrom: number;
  hourlyTo: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface SpotAvailabilityInput {
  dailyPrice: number | null;
  hourlyPrice: number | null;
  hourlyFrom: number;
  hourlyTo: number;
  startDate: string;
  endDate: string;
}

export interface SpotRules {
  maxPricePerDay: number | null;
  maxPricePerHour: number | null;
  hourlyRentalsEnabled: boolean;
}

export interface ParkingSpotResidency {
  condominiumId: string;
  condominiumName: string;
  approved: boolean;
}

export interface ParkingSpotFilter {
  status: ParkingSpotStatus | null;
  size: ParkingSpotSize | null;
  search: string;
  mine: boolean;
}

export interface ParkingSpotInput {
  number: string;
  location: string | null;
  size: ParkingSpotSize | null;
  ownerResidentId: string | null;
  clearOwner?: boolean;
}
