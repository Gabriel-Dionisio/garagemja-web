import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { CondominiumsApi } from '../../data/condominiums-api';
import { CondominiumResidentsPage } from './condominium-residents-page';

const member = (id: string, name: string, status: string, emailVerified = true) => ({
  id,
  userId: `u-${id}`,
  name,
  email: `${name.toLowerCase()}@x.com`,
  unit: null,
  block: null,
  status,
  emailVerified,
});

describe('CondominiumResidentsPage', () => {
  const decideResident = vi.fn();
  const residents = vi.fn();

  async function setup(emailVerified = true) {
    decideResident.mockReset().mockReturnValue(of(undefined));
    residents
      .mockReset()
      .mockImplementation(
        (_id: string, status: string | null, _search: string, page: number, size: number) =>
          of(toPage([member('r1', 'Ana', status ?? 'PENDING', emailVerified)], page, size, 1)),
      );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CondominiumsApi,
          useValue: {
            get: () => of({ id: 'c1', name: 'Edifício A' }),
            residents,
            joinCode: () => of('ABC234DEFG'),
            decideResident,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CondominiumResidentsPage);
    fixture.componentRef.setInput('id', 'c1');
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function actionButton(element: HTMLElement, label: string): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>(`button[aria-label="${label}: Ana"]`)!;
  }

  it('mostra o link de convite e abre em Todos, paginado no servidor', async () => {
    const { element } = await setup();
    expect(element.textContent).toContain('/join/ABC234DEFG');
    expect(element.textContent).toContain('Ana');
    expect(residents).toHaveBeenLastCalledWith('c1', null, '', 0, expect.any(Number));
    expect(element.querySelector('app-chip-group button')?.textContent).toContain('Todos');
  });

  it('troca a situação pelos chips e volta para a primeira página', async () => {
    const { fixture, element } = await setup();
    const chip = Array.from(element.querySelectorAll('app-chip-group button')).find((b) =>
      b.textContent?.includes('Aprovados'),
    ) as HTMLButtonElement;
    chip.click();
    await fixture.whenStable();
    expect(residents).toHaveBeenLastCalledWith('c1', 'APPROVED', '', 0, expect.any(Number));
  });

  it('envia o texto digitado para a API e volta para a primeira página', async () => {
    const { fixture, element } = await setup();
    const input = element.querySelector<HTMLInputElement>('app-resident-filter input')!;
    input.value = 'ana';
    input.dispatchEvent(new Event('input'));
    element
      .querySelector<HTMLFormElement>('app-resident-filter form')!
      .dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(residents).toHaveBeenLastCalledWith('c1', null, 'ana', 0, expect.any(Number));
  });

  it('decide um pedido e recarrega a lista', async () => {
    const { fixture, element } = await setup();
    actionButton(element, 'Aprovar').click();
    await fixture.whenStable();
    expect(decideResident).toHaveBeenCalledWith('r1', 'APPROVED');
    expect(residents).toHaveBeenCalledTimes(2);
  });

  it('mostra erro e não recarrega quando a decisão falha', async () => {
    const { fixture, element } = await setup();
    decideResident.mockReturnValue(throwError(() => new Error('boom')));
    actionButton(element, 'Aprovar').click();
    await fixture.whenStable();
    expect(residents).toHaveBeenCalledTimes(1);
    expect(element.querySelector('app-alert')).not.toBeNull();
  });

  it('desabilita Aprovar e explica quando o e-mail não foi confirmado', async () => {
    const { element } = await setup(false);
    const approve = actionButton(element, 'Aprovar');
    const hint = element.querySelector(`#${approve.getAttribute('aria-describedby')}`);
    expect(approve.disabled).toBe(true);
    expect(hint?.textContent).toContain('confirmar o e-mail');
    expect(element.textContent).toContain('Aguardando confirmação de e-mail');
    expect(actionButton(element, 'Rejeitar').disabled).toBe(false);
  });

  it('mantém Aprovar habilitado com e-mail confirmado', async () => {
    const { element } = await setup();
    expect(actionButton(element, 'Aprovar').disabled).toBe(false);
    expect(actionButton(element, 'Aprovar').hasAttribute('aria-describedby')).toBe(false);
  });
});
