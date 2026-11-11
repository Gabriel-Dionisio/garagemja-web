import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/auth-service';
import { LoginPage } from './login-page';
import { PendingVerificationStore } from '../../pending-verification';

describe('LoginPage', () => {
  const login = vi.fn();

  async function setup() {
    login.mockReset();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { login } }],
    });
    const fixture = TestBed.createComponent(LoginPage);
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
    return { fixture, element, fill, submit };
  }

  it('não envia formulário inválido e mostra os erros', async () => {
    const { element, submit } = await setup();
    await submit();
    expect(login).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Campo obrigatório');
  });

  it('autentica e navega para a rota pedida', async () => {
    const { fill, submit } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    login.mockReturnValue(of({ id: '1' }));
    fill('E-mail', 'ana@x.com');
    fill('Senha', 'Abcdef1!');
    await submit();
    expect(login).toHaveBeenCalledWith({
      email: 'ana@x.com',
      password: 'Abcdef1!',
      rememberMe: false,
    });
    expect(navigate).toHaveBeenCalledWith('/home');
  });

  it('envia senha fora da política de cadastro e remove espaços do e-mail', async () => {
    const { fill, submit } = await setup();
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    login.mockReturnValue(of({ id: '1' }));
    fill('E-mail', 'ana@x.com ');
    fill('Senha', 'fraca');
    await submit();
    expect(login).toHaveBeenCalledWith({
      email: 'ana@x.com',
      password: 'fraca',
      rememberMe: false,
    });
  });

  it('mostra a mensagem devolvida pela API quando as credenciais falham', async () => {
    const { element, fill, submit } = await setup();
    login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { message: 'Credenciais inválidas.' } }),
      ),
    );
    fill('E-mail', 'ana@x.com');
    fill('Senha', 'Errada12!');
    await submit();
    expect(element.querySelector('app-alert')?.textContent).toContain('Credenciais inválidas.');
  });

  it('usa o texto padrão quando a API não devolve mensagem', async () => {
    const { element, fill, submit } = await setup();
    login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    fill('E-mail', 'ana@x.com');
    fill('Senha', 'Errada12!');
    await submit();
    expect(element.querySelector('app-alert')?.textContent).toContain('Ocorreu um erro inesperado');
  });

  it('vai direto para a verificação quando o e-mail não foi confirmado', async () => {
    const { fill, submit } = await setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 403, error: { code: 'auth.email.not-verified' } }),
      ),
    );
    fill('E-mail', 'ana@x.com');
    fill('Senha', 'Abcdef1!');
    await submit();
    expect(navigate).toHaveBeenCalledWith('/verify-email');
    expect(TestBed.inject(PendingVerificationStore).take()).toEqual({
      email: 'ana@x.com',
      password: 'Abcdef1!',
    });
  });

  it('preenche o e-mail vindo do endereço', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ email: 'ana@x.com' }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="email"]');
    expect((input as HTMLInputElement).value).toBe('ana@x.com');
  });
});
