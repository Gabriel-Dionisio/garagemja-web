export type RentalStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REFUSED' | 'CANCELED' | 'FINISHED';

export interface OwnedRental {
  id: string;
  condominiumId: string;
  condominiumName: string;
  parkingSpotId: string;
  parkingSpotNumber: string;
  startDate: string;
  endDate: string;
  price: number;
  status: RentalStatus;
}

export interface OwnedRentalSummary {
  spots: number;
  pending: number;
  active: number;
  upcoming: number;
  monthEarnings: number;
}
