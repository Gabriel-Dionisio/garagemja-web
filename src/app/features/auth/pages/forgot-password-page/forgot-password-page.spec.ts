import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ForgotPasswordPage } from './forgot-password-page';

describe('ForgotPasswordPage', () => {
  const forgotPassword = vi.fn();

  async function setup() {
    forgotPassword.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { forgotPassword } }],
    });
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const submit = async () => {
      (element.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { element, submit };
  }

  it('não envia e-mail vazio', async () => {
    const { submit } = await setup();
    await submit();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it('envia o e-mail sem espaços e mostra a mensagem genérica', async () => {
    const { element, submit } = await setup();
    forgotPassword.mockReturnValue(of(undefined));
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = 'ana@x.com ';
    input.dispatchEvent(new Event('input'));
    await submit();
    expect(forgotPassword).toHaveBeenCalledWith('ana@x.com');
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('app-alert')).not.toBeNull();
  });
});
