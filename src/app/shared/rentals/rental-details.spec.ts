import { OwnedRental } from './owned-rental.model';
import { ownerRentalDetails, renterRentalDetails } from './rental-details';
import { Rental } from './rental.model';

const rental: Rental = {
  id: 'r1',
  condominiumName: 'Edifício A',
  parkingSpotId: null,
  parkingSpotNumber: '12',
  startDate: '2026-11-20',
  endDate: '2026-11-21',
  startHour: null,
  endHour: null,
  price: 80,
  total: 240,
  payable: 264,
  paid: true,
  paymentPending: false,
  status: 'ACTIVE',
  cancelReason: 'custom',
};

describe('rental details', () => {
  it('omits the spot link when the id is unknown and keeps a free-text reason', () => {
    const data = renterRentalDetails(rental, 'pt-BR');
    expect(data.link).toBeNull();
    expect(data.rows.find((row) => row.labelKey === 'rentalDetails.reason')?.text).toBe('custom');
    expect(data.rows.find((row) => row.labelKey === 'rentalDetails.paymentLabel')?.valueKey).toBe(
      'rentalDetails.payment.paid',
    );
  });

  it('links the renter profile and shows the payment on the owner side', () => {
    const owned = {
      ...rental,
      paid: false,
      paymentPending: true,
      ownerAmount: 200,
      renterUserId: 'u1',
      renterName: 'Maria',
      vehiclePlate: 'ABC1D23',
      vehicleBrand: null,
      vehicleModel: null,
    } as unknown as OwnedRental;
    const data = ownerRentalDetails(owned, 'pt-BR');
    expect(data.link?.route).toEqual(['/users', 'u1', 'profile']);
    expect(data.rows.find((row) => row.labelKey === 'rentalDetails.paymentLabel')?.valueKey).toBe(
      'rentalDetails.payment.pending',
    );
  });
});
