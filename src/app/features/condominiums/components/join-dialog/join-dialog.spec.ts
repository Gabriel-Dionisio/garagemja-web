import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CondominiumsApi } from '../../data/condominiums-api';
import { JoinDialog } from './join-dialog';

describe('JoinDialog', () => {
  async function setup(code?: string) {
    const close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: { code } },
        { provide: DialogRef, useValue: { close } },
        {
          provide: CondominiumsApi,
          useValue: {
            previewJoin: () => of({ condominiumId: 'c1', name: 'Solar', city: null, state: null }),
            join: () => of(undefined),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(JoinDialog);
    await fixture.whenStable();
    return { close, element: fixture.nativeElement as HTMLElement };
  }

  it('fecha com false ao cancelar', async () => {
    const { close, element } = await setup();
    element.querySelector<HTMLButtonElement>('.actions button')!.click();
    expect(close).toHaveBeenCalledWith(false);
  });

  it('mostra o condomínio do código do link sem entrar sozinho', async () => {
    const { close, element } = await setup('ABC234DEFG');
    expect(element.textContent).toContain('Solar');
    expect(close).not.toHaveBeenCalled();
  });
});
