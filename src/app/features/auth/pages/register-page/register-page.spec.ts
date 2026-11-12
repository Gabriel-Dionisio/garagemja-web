import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { RegisterPage } from './register-page';
import { PendingVerificationStore } from '../../pending-verification';

describe('RegisterPage', () => {
  const register = vi.fn();

  async function setup(returnUrl?: string, email?: string) {
    register.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { register } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                ...(returnUrl && { returnUrl }),
                ...(email && { email }),
              }),
            },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(RegisterPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const fill = (label: string, value: string) => {
      const input = Array.from(element.querySelectorAll('label'))
        .find((item) => item.textContent?.trim() === label)
        ?.parentElement?.querySelector('input') as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      (element.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    };
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const emailValue = () =>
      (element.querySelector('input[type=email], input[autocomplete=email]') as HTMLInputElement)
        ?.value;
    return { element, fill, submit, navigate, emailValue };
  }

  it('exige confirmação de senha igual e CPF válido', async () => {
    const { element, fill, submit } = await setup();
    fill('Nome completo', 'Ana Souza');
    fill('E-mail', 'ana@x.com');
    fill('Telefone', '11987654321');
    fill('CPF', '11111111111');
    fill('Senha', 'Abcdef1!');
    fill('Confirmar senha', 'Diferente1!');
    await submit();
    expect(register).not.toHaveBeenCalled();
    expect(element.textContent).toContain('CPF inválido');
    expect(element.textContent).toContain('As senhas não coincidem');
  });

  it('envia dígitos limpos e segue para a verificação de e-mail', async () => {
    const { fill, submit, navigate } = await setup();
    register.mockReturnValue(of(undefined));
    fill('Nome completo', 'Ana Souza');
    fill('E-mail', 'ana@x.com');
    fill('Telefone', '11987654321');
    fill('CPF', '52998224725');
    fill('Senha', 'Abcdef1!');
    fill('Confirmar senha', 'Abcdef1!');
    await submit();
    expect(register).toHaveBeenCalledWith({
      name: 'Ana Souza',
      email: 'ana@x.com',
      password: 'Abcdef1!',
      phone: '11987654321',
      cpf: '52998224725',
      accountTypes: ['RESIDENT'],
    });
    expect(navigate).toHaveBeenCalledWith('/verify-email');
    expect(TestBed.inject(PendingVerificationStore).take()).toEqual({
      email: 'ana@x.com',
      password: 'Abcdef1!',
    });
  });

  it('guarda a rota de retorno recebida para depois da verificação de e-mail', async () => {
    const { fill, submit } = await setup('/join/ABCDEFGHJK');
    register.mockReturnValue(of(undefined));
    fill('Nome completo', 'Ana Souza');
    fill('E-mail', 'ana@x.com');
    fill('Telefone', '11987654321');
    fill('CPF', '52998224725');
    fill('Senha', 'Abcdef1!');
    fill('Confirmar senha', 'Abcdef1!');
    await submit();
    expect(TestBed.inject(PendingVerificationStore).take()).toEqual({
      email: 'ana@x.com',
      password: 'Abcdef1!',
      returnUrl: '/join/ABCDEFGHJK',
    });
  });

  it('preenche o e-mail vindo do convite', async () => {
    const { emailValue } = await setup(undefined, 'Ana@X.com');
    expect(emailValue()).toBe('ana@x.com');
  });

  it('ignora o e-mail do link quando inválido', async () => {
    const { emailValue } = await setup(undefined, 'nao é e-mail');
    expect(emailValue()).toBe('');
  });
});
