import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { provideTestTranslations } from '../../../../testing/translations';
import { PendingVerificationStore } from '../../pending-verification';
import { ConfirmEmailPage } from './confirm-email-page';

describe('ConfirmEmailPage', () => {
  const confirmEmail = vi.fn();

  async function setup(oobCode: string | undefined, email?: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTestTranslations(),
        { provide: AuthService, useValue: { confirmEmail } },
      ],
    });
    if (email) TestBed.inject(PendingVerificationStore).hold({ email, password: 'x' });
    const fixture = TestBed.createComponent(ConfirmEmailPage);
    fixture.componentRef.setInput('oobCode', oobCode);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => confirmEmail.mockReset());

  it('confirma o e-mail com o código do link e oferece o login', async () => {
    confirmEmail.mockReturnValue(of(undefined));
    const element = await setup('abc-123');
    expect(confirmEmail).toHaveBeenCalledWith('abc-123');
    expect(element.textContent).toContain('E-mail confirmado');
    expect(element.querySelector('a[href="/login"]')).not.toBeNull();
  });

  it('mostra o erro da API quando o link é inválido ou expirou', async () => {
    confirmEmail.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { code: 'auth.verification.link.invalid', message: 'Link expirado' },
          }),
      ),
    );
    const element = await setup('old');
    expect(element.textContent).toContain('Link expirado');
    expect(element.querySelector('app-alert')).not.toBeNull();
  });

  it('sem código no endereço não chama a API e mostra falha', async () => {
    const element = await setup(undefined);
    expect(confirmEmail).not.toHaveBeenCalled();
    expect(element.textContent).toContain('inválido');
  });

  it('leva ao login com o e-mail do cadastro preenchido', async () => {
    confirmEmail.mockReturnValue(of(undefined));
    const element = await setup('abc', 'ana@x.com');
    expect(element.querySelector('a[href="/login?email=ana@x.com"]')).not.toBeNull();
  });
});
