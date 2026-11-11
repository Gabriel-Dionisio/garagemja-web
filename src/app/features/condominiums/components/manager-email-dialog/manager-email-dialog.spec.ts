import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { ManagerEmailDialog } from './manager-email-dialog';

describe('ManagerEmailDialog', () => {
  async function setup(withReason: boolean) {
    const close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: { title: 'x', hint: 'y', confirmLabel: 'common.actions.save', withReason },
        },
        { provide: DialogRef, useValue: { close } },
      ],
    });
    const fixture = TestBed.createComponent(ManagerEmailDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const type = async (index: number, value: string) => {
      const input = element.querySelectorAll('input')[index];
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const submit = () => element.querySelector('form')!.dispatchEvent(new Event('submit'));
    return { close, type, submit };
  }

  it('não fecha com e-mail inválido', async () => {
    const { close, type, submit } = await setup(false);
    await type(0, 'abc');
    submit();
    expect(close).not.toHaveBeenCalled();
  });

  it('devolve e-mail e motivo quando válidos', async () => {
    const { close, type, submit } = await setup(true);
    await type(0, 'novo@x.com');
    await type(1, 'aposentou');
    submit();
    expect(close).toHaveBeenCalledWith({ email: 'novo@x.com', reason: 'aposentou' });
  });

  it('exige o motivo quando pedido', async () => {
    const { close, type, submit } = await setup(true);
    await type(0, 'novo@x.com');
    submit();
    expect(close).not.toHaveBeenCalled();
  });
});
