import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { ParkingSpotsApi } from '../../../../shared/spots/parking-spots-api';
import { ParkingSpotsPage } from './parking-spots-page';

const spot = (status: string) => ({
  id: 's1',
  condominiumId: 'c1',
  ownerResidentId: 'r1',
  owner: { residentId: 'r1', name: 'Ana', unit: '12', block: null },
  number: '12',
  location: 'Subsolo',
  size: 'SMALL',
  status,
  statusReason: null,
  imageUrl: null,
  thumbnailUrl: null,
});

describe('ParkingSpotsPage', () => {
  const list = vi.fn();
  const setStatus = vi.fn();
  const remove = vi.fn();
  const askReason = vi.fn();

  async function setup(canManage: boolean, status = 'PENDING') {
    list
      .mockReset()
      .mockImplementation((_id, _filter, page: number, size: number) =>
        of(toPage([spot(status)], page, size, 1)),
      );
    setStatus.mockReset().mockReturnValue(of(spot('ACTIVE')));
    remove.mockReset().mockReturnValue(of(undefined));
    askReason.mockReset().mockReturnValue(of('Duplicada'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ParkingSpotsApi,
          useValue: {
            condominium: () => of({ id: 'c1', name: 'Edifício A', status: 'ACTIVE', canManage }),
            list,
            setStatus,
            remove,
          },
        },
        { provide: ConfirmService, useValue: { confirm: () => of(true), askReason } },
      ],
    });
    const fixture = TestBed.createComponent(ParkingSpotsPage);
    fixture.componentRef.setInput('id', 'c1');
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  const button = (element: HTMLElement, label: string) =>
    element.querySelector<HTMLButtonElement>(`button[aria-label="${label}: 12"]`)!;

  it('lista paginada no servidor e mostra o dono para o síndico', async () => {
    const { element } = await setup(true);
    expect(list).toHaveBeenLastCalledWith(
      'c1',
      { status: null, size: null, search: '', mine: false },
      0,
      expect.any(Number),
    );
    expect(element.textContent).toContain('Vaga 12');
    expect(element.textContent).toContain('Ana');
  });

  it('clicar na vaga abre os detalhes', async () => {
    const { element } = await setup(true);
    expect(
      element.querySelector('li a[href="/condominiums/c1/parking-spots/s1"]:not([appIconButton])'),
    ).not.toBeNull();
  });

  it('síndico aprova e a lista recarrega', async () => {
    const { fixture, element } = await setup(true);
    button(element, 'Aprovar').click();
    await fixture.whenStable();
    expect(setStatus).toHaveBeenCalledWith('s1', 'ACTIVE');
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('síndico rejeita com motivo', async () => {
    const { fixture, element } = await setup(true);
    button(element, 'Rejeitar').click();
    await fixture.whenStable();
    expect(setStatus).toHaveBeenCalledWith('s1', 'REJECTED', 'Duplicada');
  });

  it('síndico bloqueia com motivo', async () => {
    const { fixture, element } = await setup(true, 'ACTIVE');
    button(element, 'Bloquear').click();
    await fixture.whenStable();
    expect(askReason).toHaveBeenCalled();
    expect(setStatus).toHaveBeenCalledWith('s1', 'BLOCKED', 'Duplicada');
  });
});
