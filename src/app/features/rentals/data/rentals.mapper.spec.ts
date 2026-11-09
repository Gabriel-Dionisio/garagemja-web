import {
  isActiveRental,
  isHistoricalRental,
  isRentalRequest,
  RENTAL_STATUSES,
} from '../rental.model';
import { toRentalRecords, toResidentIds } from './rentals.mapper';

describe('rentals mapper', () => {
  it('accepts only the authenticated user residents', () => {
    expect(toResidentIds([{ id: 'resident-1', userId: 'user-1' }], 'user-1')).toEqual([
      'resident-1',
    ]);
    expect(() => toResidentIds([{ id: 'resident-2', userId: 'user-2' }], 'user-1')).toThrow();
  });

  it('classifies every API status into exactly one rental tab', () => {
    const rentals = toRentalRecords([
      {
        id: 'rental-1',
        condominiumId: 'condominium-1',
        parkingSpotId: 'spot-1',
        renterResidentId: 'resident-1',
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        price: 8,
        status: 'PENDING',
        createdAt: '2026-09-01T10:00:00Z',
      },
    ]);

    expect(isRentalRequest(rentals[0].status)).toBe(true);
    expect(isRentalRequest('APPROVED')).toBe(true);
    expect(isRentalRequest('REFUSED')).toBe(true);
    expect(isRentalRequest('CANCELED')).toBe(true);
    expect(isRentalRequest('ACTIVE')).toBe(false);
    expect(isHistoricalRental('FINISHED')).toBe(true);
    expect(isHistoricalRental('CANCELED')).toBe(false);
    expect(isHistoricalRental('ACTIVE')).toBe(false);
    expect(isRentalRequest('FINISHED')).toBe(false);
    for (const status of RENTAL_STATUSES) {
      expect(
        [isActiveRental(status), isRentalRequest(status), isHistoricalRental(status)].filter(
          Boolean,
        ),
      ).toHaveLength(1);
    }
  });

  it('rejects unknown API statuses instead of treating them as empty data', () => {
    expect(() =>
      toRentalRecords([
        {
          id: 'rental-1',
          condominiumId: 'condominium-1',
          parkingSpotId: 'spot-1',
          renterResidentId: 'resident-1',
          startDate: '2026-10-01',
          endDate: '2026-10-02',
          price: 8,
          status: 'WAITING',
          createdAt: '2026-09-01T10:00:00Z',
        },
      ]),
    ).toThrow();
  });
});
