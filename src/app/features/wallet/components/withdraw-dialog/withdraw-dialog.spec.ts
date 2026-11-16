import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { WalletsApi } from '../../data/wallets-api';
import { WithdrawDialog } from './withdraw-dialog';

describe('WithdrawDialog', () => {
  const withdraw = vi.fn();
  const close = vi.fn();

  async function setup() {
    withdraw.mockReset().mockReturnValue(of(undefined));
    close.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: WalletsApi, useValue: { withdraw } },
        { provide: DialogRef, useValue: { close } },
        {
          provide: DIALOG_DATA,
          useValue: {
            wallet: { type: 'OWNER', refId: 'u1', name: 'Maria', available: 40, pending: 0 },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(WithdrawDialog);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const inputs = element.querySelectorAll<HTMLInputElement>('input');
    const type = async (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const submit = async () => {
      element.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
      await fixture.whenStable();
    };
    return { fixture, element, amount: inputs[0], pixKey: inputs[1], type, submit };
  }

  it('does not submit an invalid form', async () => {
    const { submit } = await setup();
    await submit();
    expect(withdraw).not.toHaveBeenCalled();
  });

  it('sends the withdrawal and closes with success', async () => {
    const { amount, pixKey, type, submit } = await setup();
    await type(amount, '12,50');
    await type(pixKey, ' a@b.com ');
    await submit();
    expect(withdraw).toHaveBeenCalledWith(
      { type: 'OWNER', refId: 'u1', amount: 12.5, pixKey: 'a@b.com' },
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(close).toHaveBeenCalledWith(true);
  });

  it('shows the insufficient balance error and stays open', async () => {
    const { element, fixture, amount, pixKey, type, submit } = await setup();
    withdraw.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    await type(amount, '99');
    await type(pixKey, 'a@b.com');
    await submit();
    fixture.detectChanges();
    expect(element.querySelector('app-alert')).not.toBeNull();
    expect(close).not.toHaveBeenCalled();
  });
});
