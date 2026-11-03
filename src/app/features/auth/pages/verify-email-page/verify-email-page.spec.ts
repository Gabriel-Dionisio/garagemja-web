import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { PendingVerificationStore } from '../../pending-verification';
import { VerifyEmailPage } from './verify-email-page';

describe('VerifyEmailPage', () => {
  const resendVerification = vi.fn(() => of(undefined));

  function setup(pending: { email: string; password: string } | null) {
    resendVerification.mockClear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { resendVerification } }],
    });
    if (pending) TestBed.inject(PendingVerificationStore).hold(pending);
    const fixture = TestBed.createComponent(VerifyEmailPage);
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('reenvia com e-mail e senha guardados e limpa o armazenamento', async () => {
    const { fixture, element } = setup({ email: 'ana@x.com', password: 'Abcdef1!' });
    await fixture.whenStable();
    const resend = element.querySelector('button') as HTMLButtonElement;
    resend.click();
    expect(resendVerification).toHaveBeenCalledWith({ email: 'ana@x.com', password: 'Abcdef1!' });
    expect(TestBed.inject(PendingVerificationStore).take()).toBeNull();
  });

  it('sem estado não oferece reenvio', async () => {
    const { fixture, element } = setup(null);
    await fixture.whenStable();
    expect(element.querySelector('button')).toBeNull();
  });
});
