import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { SpotAvailability, SpotRules } from '../../../../shared/spots/parking-spot.model';
import { AvailabilityDialog, AvailabilityDialogData } from './availability-dialog';

describe('AvailabilityDialog', () => {
  function setup(rules: SpotRules, availability: SpotAvailability | null = null) {
    const close = vi.fn();
    const data: AvailabilityDialogData = { rules, availability };
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(AvailabilityDialog);
    fixture.detectChanges();
    return { close, fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('mostra preço por hora e janela só quando o condomínio permite', () => {
    const off = setup({ maxPricePerDay: null, maxPricePerHour: null, hourlyRentalsEnabled: false });
    expect(off.element.querySelectorAll('app-text-field')).toHaveLength(1);
    expect(off.element.querySelectorAll('app-select-field')).toHaveLength(0);
  });

  it('inclui os campos por hora quando habilitado', () => {
    const on = setup({ maxPricePerDay: null, maxPricePerHour: null, hourlyRentalsEnabled: true });
    expect(on.element.querySelectorAll('app-text-field')).toHaveLength(2);
    expect(on.element.querySelectorAll('app-select-field')).toHaveLength(2);
  });

  it('não fecha com dados inválidos', () => {
    const { close, element } = setup({
      maxPricePerDay: null,
      maxPricePerHour: null,
      hourlyRentalsEnabled: false,
    });
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect(close).not.toHaveBeenCalled();
  });

  it('exige ao menos um preço, por dia ou por hora', async () => {
    const { close, element, fixture } = setup({
      maxPricePerDay: null,
      maxPricePerHour: null,
      hourlyRentalsEnabled: true,
    });
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(element.querySelectorAll('app-alert')).toHaveLength(2);
    expect(close).not.toHaveBeenCalled();
  });

  const hourlyOn: SpotRules = {
    maxPricePerDay: null,
    maxPricePerHour: null,
    hourlyRentalsEnabled: true,
  };
  const saved = (overrides: Partial<SpotAvailability>): SpotAvailability => ({
    id: 'a1',
    parkingSpotId: 's1',
    dailyPrice: null,
    hourlyPrice: null,
    hourlyFrom: 8,
    hourlyTo: 18,
    startDate: '2030-01-10',
    endDate: '2030-01-20',
    active: true,
    ...overrides,
  });
  const submit = (element: HTMLElement) =>
    element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();

  it('ao editar, envia só o preço por hora com a janela escolhida', () => {
    const { close, element } = setup(hourlyOn, saved({ hourlyPrice: 5 }));
    expect(element.querySelector('h2')?.textContent).toContain('Editar período');
    submit(element);
    expect(close).toHaveBeenCalledWith({
      dailyPrice: null,
      hourlyPrice: 5,
      hourlyFrom: 8,
      hourlyTo: 18,
      startDate: '2030-01-10',
      endDate: '2030-01-20',
    });
  });

  it('só diária volta a janela para o dia inteiro', () => {
    const { close, element } = setup(hourlyOn, saved({ dailyPrice: 30 }));
    submit(element);
    expect(close).toHaveBeenCalledWith(
      expect.objectContaining({ dailyPrice: 30, hourlyPrice: null, hourlyFrom: 0, hourlyTo: 24 }),
    );
  });

  it('ignora o preço por hora quando o condomínio desligou o aluguel por hora', () => {
    const { close, element } = setup(
      { ...hourlyOn, hourlyRentalsEnabled: false },
      saved({ dailyPrice: 30, hourlyPrice: 5 }),
    );
    submit(element);
    expect(close).toHaveBeenCalledWith(expect.objectContaining({ hourlyPrice: null }));
  });

  it('recusa janela com fim antes do início', async () => {
    const { close, element, fixture } = setup(
      hourlyOn,
      saved({ hourlyPrice: 5, hourlyFrom: 18, hourlyTo: 8 }),
    );
    submit(element);
    await fixture.whenStable();
    expect(element.textContent).toContain('O horário final deve ser depois do inicial.');
    expect(close).not.toHaveBeenCalled();
  });
});
