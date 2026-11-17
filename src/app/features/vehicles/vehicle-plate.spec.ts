import { FormControl } from '@angular/forms';
import { displayPlate, formatPlate, plateValidator } from './vehicle-plate';

describe('vehicle plate', () => {
  it('normalizes the typed value', () => {
    expect(formatPlate('abc-1d23 x')).toBe('ABC1D23');
    expect(formatPlate('abc-1234')).toBe('ABC1234');
  });

  it('accepts the legacy and Mercosul formats', () => {
    expect(plateValidator(new FormControl('ABC1234'))).toBeNull();
    expect(plateValidator(new FormControl('ABC1D23'))).toBeNull();
    expect(plateValidator(new FormControl(''))).toBeNull();
  });

  it('rejects other formats', () => {
    expect(plateValidator(new FormControl('AB12345'))).toEqual({ plate: true });
    expect(plateValidator(new FormControl('ABC12'))).toEqual({ plate: true });
  });

  it('displays the legacy format with a hyphen', () => {
    expect(displayPlate('ABC1234')).toBe('ABC-1234');
    expect(displayPlate('ABC1D23')).toBe('ABC1D23');
  });
});
