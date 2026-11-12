import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SecurityApi } from '../../data/security-api';
import { TwoFactorDialog, TwoFactorMode } from './two-factor-dialog';

describe('TwoFactorDialog', () => {
  const close = vi.fn();
  const api = {
    setup: vi.fn(() => of({ secret: 'ABCD', otpauthUri: 'otpauth://totp/x?secret=ABCD' })),
    confirm: vi.fn(() => of(['AAAAA-BBBBB'])),
    disable: vi.fn(() => of(undefined)),
    regenerateRecoveryCodes: vi.fn(() => of(['CCCCC-DDDDD'])),
  };

  async function setup(mode: TwoFactorMode) {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: { mode } },
        { provide: DialogRef, useValue: { close } },
        { provide: SecurityApi, useValue: api },
      ],
    });
    const fixture = TestBed.createComponent(TwoFactorDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const submit = async (code: string) => {
      const input = element.querySelector('input') as HTMLInputElement;
      input.value = code;
      input.dispatchEvent(new Event('input'));
      (element.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { element, submit };
  }

  it('ativar inicia o setup, confirma o código e mostra os códigos de recuperação', async () => {
    const { element, submit } = await setup('enable');
    expect(api.setup).toHaveBeenCalled();
    expect(element.textContent).toContain('ABCD');
    await submit('123456');
    expect(api.confirm).toHaveBeenCalledWith('123456');
    expect(element.querySelector('.codes')?.textContent).toContain('AAAAA-BBBBB');
  });

  it('desativar envia o código e fecha informando a mudança', async () => {
    const { submit } = await setup('disable');
    expect(api.setup).not.toHaveBeenCalled();
    await submit('123456');
    expect(api.disable).toHaveBeenCalledWith('123456');
    expect(close).toHaveBeenCalledWith(true);
  });

  it('gerar novos códigos mostra a lista nova', async () => {
    const { element, submit } = await setup('regenerate');
    await submit('123456');
    expect(api.regenerateRecoveryCodes).toHaveBeenCalledWith('123456');
    expect(element.querySelector('.codes')?.textContent).toContain('CCCCC-DDDDD');
  });

  it('não envia sem código', async () => {
    const { submit } = await setup('disable');
    await submit('');
    expect(api.disable).not.toHaveBeenCalled();
  });
});
