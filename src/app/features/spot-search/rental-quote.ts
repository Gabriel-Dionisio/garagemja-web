import { SpotAvailability } from '../parking-spots/parking-spot.model';

export type RentalMode = 'DAY' | 'HOUR';

export interface RentalQuoteInput {
  mode: RentalMode;
  startDate: string;
  endDate: string;
  startHour: number;
  endHour: number;
}

export interface RentalQuote {
  unitPrice: number;
  units: number;
  total: number;
}

const DAY_MS = 86_400_000;

export function coveringAvailability(
  availabilities: readonly SpotAvailability[],
  startDate: string,
  endDate: string,
): SpotAvailability | null {
  return (
    availabilities.find(
      (item) => item.active && item.startDate <= startDate && item.endDate >= endDate,
    ) ?? null
  );
}

export function quoteRental(
  availabilities: readonly SpotAvailability[],
  input: RentalQuoteInput,
): RentalQuote | null {
  const { mode, startDate, endDate, startHour, endHour } = input;
  if (!startDate || !endDate || endDate < startDate) return null;
  const availability = coveringAvailability(availabilities, startDate, endDate);
  if (!availability) return null;
  if (mode === 'HOUR') {
    const units = endHour - startHour;
    const unitPrice = availability.hourlyPrice;
    if (startDate !== endDate || unitPrice === null || units <= 0) return null;
    if (startHour < availability.hourlyFrom || endHour > availability.hourlyTo) return null;
    return { unitPrice, units, total: Math.round(unitPrice * units * 100) / 100 };
  }
  const unitPrice = availability.dailyPrice;
  if (unitPrice === null) return null;
  const units =
    Math.round(
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS,
    ) + 1;
  return { unitPrice, units, total: Math.round(unitPrice * units * 100) / 100 };
}
