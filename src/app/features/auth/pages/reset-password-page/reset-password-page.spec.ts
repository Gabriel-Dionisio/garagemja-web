import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ResetPasswordPage } from './reset-password-page';

describe('ResetPasswordPage', () => {
  const resetPassword = vi.fn();

  async function setup(oobCode?: string) {
    resetPassword.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { resetPassword } }],
    });
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.componentRef.setInput('oobCode', oobCode);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const fill = (index: number, value: string) => {
      const input = element.querySelectorAll('input')[index] as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      (element.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    return { element, fill, submit };
  }

  it('sem código no link oferece pedir um novo e não mostra o formulário', async () => {
    const { element } = await setup();
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('a[href="/forgot-password"]')).not.toBeNull();
  });

  it('não envia senha fraca', async () => {
    const { fill, submit } = await setup('code');
    fill(0, 'fraca');
    fill(1, 'fraca');
    await submit();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('envia o código e a nova senha e mostra o sucesso', async () => {
    const { element, fill, submit } = await setup('code');
    resetPassword.mockReturnValue(of(undefined));
    fill(0, 'Abcdef1!');
    fill(1, 'Abcdef1!');
    await submit();
    expect(resetPassword).toHaveBeenCalledWith('code', 'Abcdef1!');
    expect(element.querySelector('form')).toBeNull();
  });
});
