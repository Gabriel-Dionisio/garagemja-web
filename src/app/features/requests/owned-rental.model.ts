export type RentalStatus =
  'PENDING' | 'APPROVED' | 'ACTIVE' | 'REFUSED' | 'CANCELED' | 'FINISHED' | 'EXPIRED';

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
  renterName: string;
  renterPhotoUrl: string | null;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
}
