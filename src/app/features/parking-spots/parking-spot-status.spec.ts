import { aboveCap, spotBadge } from './parking-spot-status';
import { ParkingSpot, SpotAvailability } from './parking-spot.model';

const base = { status: 'ACTIVE', availability: null } as ParkingSpot;

describe('spotBadge', () => {
  it('usa o estado real da vaga', () => {
    expect(spotBadge({ ...base, status: 'PENDING' }).labelKey).toBe('parkingSpots.status.PENDING');
    expect(spotBadge({ ...base, status: 'REJECTED' }).tone).toBe('danger');
    expect(spotBadge(base).labelKey).toBe('parkingSpots.badge.unavailable');
    expect(
      spotBadge({
        ...base,
        availability: { dailyPrice: 5, hourlyPrice: null, startDate: '', endDate: '' },
      }).labelKey,
    ).toBe('parkingSpots.badge.available');
  });
});

describe('aboveCap', () => {
  const item = { dailyPrice: 30, hourlyPrice: 8 } as SpotAvailability;
  const none = { maxPricePerDay: null, maxPricePerHour: null, hourlyRentalsEnabled: true };

  it('avisa só quando o preço passa do teto atual', () => {
    expect(aboveCap(item, none)).toBe(false);
    expect(aboveCap(item, { ...none, maxPricePerDay: 30 })).toBe(false);
    expect(aboveCap(item, { ...none, maxPricePerDay: 25 })).toBe(true);
    expect(aboveCap(item, { ...none, maxPricePerHour: 5 })).toBe(true);
  });
});
