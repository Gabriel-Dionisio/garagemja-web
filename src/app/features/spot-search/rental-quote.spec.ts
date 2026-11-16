import { SpotAvailability } from '../parking-spots/parking-spot.model';
import { quoteRental } from './rental-quote';

const availability: SpotAvailability = {
  id: 'a1',
  parkingSpotId: 's1',
  dailyPrice: 50,
  hourlyPrice: 8,
  hourlyFrom: 8,
  hourlyTo: 20,
  startDate: '2030-01-01',
  endDate: '2030-01-31',
  active: true,
};

const day = { mode: 'DAY' as const, startHour: 0, endHour: 0 };
const hour = { mode: 'HOUR' as const, startDate: '2030-01-10', endDate: '2030-01-10' };

describe('quoteRental', () => {
  it('cobra diárias de forma inclusiva', () => {
    expect(
      quoteRental([availability], { ...day, startDate: '2030-01-10', endDate: '2030-01-12' }),
    ).toEqual({
      unitPrice: 50,
      units: 3,
      total: 150,
    });
  });

  it('cobra por hora dentro da janela', () => {
    expect(quoteRental([availability], { ...hour, startHour: 9, endHour: 12 })?.total).toBe(24);
  });

  it('recusa hora fora da janela, em dias diferentes ou sem preço por hora', () => {
    expect(quoteRental([availability], { ...hour, startHour: 6, endHour: 9 })).toBeNull();
    expect(
      quoteRental([availability], { ...hour, endDate: '2030-01-11', startHour: 9, endHour: 12 }),
    ).toBeNull();
    expect(
      quoteRental([{ ...availability, hourlyPrice: null }], { ...hour, startHour: 9, endHour: 12 }),
    ).toBeNull();
  });

  it('recusa período não coberto ou invertido', () => {
    expect(
      quoteRental([availability], { ...day, startDate: '2030-01-30', endDate: '2030-02-02' }),
    ).toBeNull();
    expect(
      quoteRental([availability], { ...day, startDate: '2030-01-12', endDate: '2030-01-10' }),
    ).toBeNull();
  });
});
