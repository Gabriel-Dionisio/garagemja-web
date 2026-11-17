import { moneyFormatter, periodText } from '../forms/format';
import { displayPlate } from '../forms/plate';
import { OwnedRental } from './owned-rental.model';
import { Rental, RentalStatus } from './rental.model';

const REASON_CODES = ['unpaid', 'condominium_closed'];

export interface DetailRow {
  labelKey: string;
  text?: string;
  valueKey?: string;
  params?: Record<string, string | number>;
}

export interface RentalDetailsData {
  status: RentalStatus;
  rows: DetailRow[];
  link: { labelKey: string; route: readonly string[] } | null;
}

function reasonRow(cancelReason: string | null): DetailRow[] {
  if (!cancelReason) return [];
  return REASON_CODES.includes(cancelReason)
    ? [{ labelKey: 'rentalDetails.reason', valueKey: `rentals.reasonCode.${cancelReason}` }]
    : [{ labelKey: 'rentalDetails.reason', text: cancelReason }];
}

function commonRows(rental: Rental | OwnedRental, language: string): DetailRow[] {
  const money = moneyFormatter(language);
  const when = periodText(rental, language);
  return [
    { labelKey: 'rentalDetails.spot', text: rental.parkingSpotNumber },
    { labelKey: 'rentalDetails.condominium', text: rental.condominiumName },
    { labelKey: 'rentalDetails.period', valueKey: when.key, params: when.params },
    { labelKey: 'rentalDetails.price', text: money(rental.price) },
    { labelKey: 'rentalDetails.total', text: money(rental.total) },
  ];
}

function paymentKey(rental: { paid: boolean; paymentPending: boolean }): string {
  if (rental.paid) return 'rentalDetails.payment.paid';
  return rental.paymentPending ? 'rentalDetails.payment.pending' : 'rentalDetails.payment.unpaid';
}

export function renterRentalDetails(rental: Rental, language: string): RentalDetailsData {
  const money = moneyFormatter(language);
  return {
    status: rental.status,
    rows: [
      ...commonRows(rental, language),
      { labelKey: 'rentalDetails.payable', text: money(rental.payable) },
      { labelKey: 'rentalDetails.paymentLabel', valueKey: paymentKey(rental) },
      ...reasonRow(rental.cancelReason),
    ],
    link: rental.parkingSpotId
      ? { labelKey: 'rentalDetails.viewSpot', route: ['/search', rental.parkingSpotId] }
      : null,
  };
}

export function ownerRentalDetails(rental: OwnedRental, language: string): RentalDetailsData {
  const money = moneyFormatter(language);
  const model = [rental.vehicleBrand, rental.vehicleModel].filter(Boolean).join(' ');
  const vehicle = [model, displayPlate(rental.vehiclePlate)].filter(Boolean).join(' · ');
  return {
    status: rental.status,
    rows: [
      { labelKey: 'rentalDetails.renter', text: rental.renterName },
      { labelKey: 'rentalDetails.vehicle', text: vehicle },
      ...commonRows(rental, language),
      { labelKey: 'rentalDetails.ownerAmount', text: money(rental.ownerAmount) },
      { labelKey: 'rentalDetails.paymentLabel', valueKey: paymentKey(rental) },
      ...reasonRow(rental.cancelReason),
    ],
    link: rental.renterUserId
      ? { labelKey: 'rentalDetails.viewProfile', route: ['/users', rental.renterUserId, 'profile'] }
      : null,
  };
}
