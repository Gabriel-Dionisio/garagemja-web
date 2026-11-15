import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { ParkingSpotsApi } from '../../data/parking-spots-api';
import { SpotAvailability, SpotAvailabilityInput, SpotRules } from '../../parking-spot.model';
import { SpotAvailabilities } from './spot-availabilities';

const period = (overrides: Partial<SpotAvailability> = {}): SpotAvailability => ({
  id: 'a1',
  parkingSpotId: 's1',
  dailyPrice: 30,
  hourlyPrice: null,
  hourlyFrom: 0,
  hourlyTo: 24,
  startDate: '2030-01-10',
  endDate: '2030-01-20',
  active: true,
  ...overrides,
});

const NO_CAP: SpotRules = {
  maxPricePerDay: null,
  maxPricePerHour: null,
  hourlyRentalsEnabled: true,
};

describe('SpotAvailabilities', () => {
  async function setup(
    items: SpotAvailability[] = [],
    {
      rules = NO_CAP,
      confirmed = true,
      dialogResult,
      editable = true,
    }: {
      rules?: SpotRules;
      confirmed?: boolean;
      dialogResult?: SpotAvailabilityInput;
      editable?: boolean;
    } = {},
  ) {
    const api = {
      rules: vi.fn(() => of(rules)),
      availabilities: vi.fn(() => of(items)),
      updateAvailability: vi.fn(() => of(items[0])),
      createAvailability: vi.fn(() => of(items[0])),
      removeAvailability: vi.fn(() => of(undefined)),
    };
    const confirm = vi.fn(() => of(confirmed));
    const open = vi.fn(() => ({ closed: of(dialogResult) }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ParkingSpotsApi, useValue: api },
        { provide: ConfirmService, useValue: { confirm } },
        { provide: Dialog, useValue: { open } },
      ],
    });
    const fixture = TestBed.createComponent(SpotAvailabilities);
    fixture.componentRef.setInput('spotId', 's1');
    fixture.componentRef.setInput('condominiumId', 'c1');
    fixture.componentRef.setInput('editable', editable);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const click = async (selector: string) => {
      element.querySelector<HTMLButtonElement>(selector)?.click();
      await fixture.whenStable();
    };
    return { api, confirm, open, element, click };
  }

  it('carrega regras e períodos da vaga', async () => {
    const { api, element } = await setup();
    expect(api.rules).toHaveBeenCalledWith('c1');
    expect(api.availabilities).toHaveBeenCalledWith('s1');
    expect(element.textContent).toContain('Nenhum período cadastrado.');
  });

  it('mostra só a diária quando não há preço por hora', async () => {
    const { element } = await setup([period()]);
    const text = element.querySelector('li small')?.textContent ?? '';
    expect(text).toContain('/dia');
    expect(text).not.toContain('/hora');
    expect(text).not.toContain('·');
  });

  it('mostra só o preço por hora com a janela quando não há diária', async () => {
    const { element } = await setup([
      period({ dailyPrice: null, hourlyPrice: 5, hourlyFrom: 8, hourlyTo: 18 }),
    ]);
    const text = (element.querySelector('li small')?.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).not.toContain('/dia');
    expect(text).toContain('/hora · 8h às 18h');
    expect(text.trim().startsWith('·')).toBe(false);
  });

  it('avisa quando o preço passa do teto atual', async () => {
    const { element } = await setup([period({ dailyPrice: 50 })], {
      rules: { ...NO_CAP, maxPricePerDay: 40 },
    });
    expect(element.querySelector('app-badge')?.textContent).toContain('Acima do teto atual');
  });

  it('somente leitura esconde criar, editar, remover e o switch', async () => {
    const { element } = await setup([period()], { editable: false });
    expect(element.querySelector('[role="switch"]')).toBeNull();
    expect(element.querySelectorAll('button').length).toBe(0);
    expect(element.textContent).toContain('Só o dono gerencia a disponibilidade desta vaga.');
  });

  it('o switch desativa o período e recarrega a lista', async () => {
    const { api, click } = await setup([period()]);
    await click('[role="switch"]');
    expect(api.updateAvailability).toHaveBeenCalledWith('a1', { active: false });
    expect(api.availabilities).toHaveBeenCalledTimes(2);
  });

  it('remove só depois de confirmar', async () => {
    const yes = await setup([period()]);
    await yes.click('button[aria-label^="Remover período"]');
    expect(yes.confirm).toHaveBeenCalledWith(expect.objectContaining({ danger: true }));
    expect(yes.api.removeAvailability).toHaveBeenCalledWith('a1');
    expect(yes.api.availabilities).toHaveBeenCalledTimes(2);
  });

  it('não remove quando a confirmação é cancelada', async () => {
    const no = await setup([period()], { confirmed: false });
    await no.click('button[aria-label^="Remover período"]');
    expect(no.api.removeAvailability).not.toHaveBeenCalled();
  });

  it('ao editar, limpa no servidor o preço que ficou vazio', async () => {
    const input: SpotAvailabilityInput = {
      dailyPrice: null,
      hourlyPrice: 5,
      hourlyFrom: 8,
      hourlyTo: 18,
      startDate: '2030-01-10',
      endDate: '2030-01-20',
    };
    const { api, open, click } = await setup([period()], { dialogResult: input });
    await click('button[aria-label^="Editar"]');
    expect(open).toHaveBeenCalled();
    expect(api.updateAvailability).toHaveBeenCalledWith('a1', {
      ...input,
      clearDailyPrice: true,
    });
  });
});
