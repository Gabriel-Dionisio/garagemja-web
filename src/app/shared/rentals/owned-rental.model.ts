import { RentalStatus } from '../models/rental-status';

export type { RentalStatus } from '../models/rental-status';

export interface OwnedRental {
  id: string;
  condominiumId: string;
  condominiumName: string;
  parkingSpotId: string;
  parkingSpotNumber: string;
  startDate: string;
  endDate: string;
  startHour: number | null;
  endHour: number | null;
  price: number;
  total: number;
  ownerAmount: number;
  status: RentalStatus;
  cancelReason: string | null;
  renterUserId: string | null;
  renterName: string;
  renterPhotoUrl: string | null;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  paid: boolean;
  paymentPending: boolean;
}
