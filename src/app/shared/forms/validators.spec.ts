import { FormControl, FormGroup } from '@angular/forms';
import { formatCpf, formatEmailInput, formatNameInput, formatPhone, onlyDigits } from './masks';
import { cpfValidator } from './cpf';
import { isStrongPassword, passwordPolicyValidator } from './password-policy';
import { formatPersonName, personNameValidator, phoneValidator, sameAs } from './validators';

describe('masks', () => {
  it('formata CPF e telefone progressivamente', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01');
    expect(formatCpf('1234')).toBe('123.4');
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
    expect(onlyDigits('(11) 9-8765')).toBe('1198765');
  });

  it('formata telefones brasileiros com 10 ou 11 dígitos e remove caracteres', () => {
    expect(formatPhone('(16) 3333-3333')).toBe('(16) 3333-3333');
    expect(formatPhone('(16) 99999-9999')).toBe('(16) 99999-9999');
    expect(formatPhone('16abc999993333')).toBe('(16) 99999-3333');
    expect(formatPhone('163333333399999')).toBe('(16) 33333-3339');
  });

  it('limita o telefone aos 11 dígitos numéricos', () => {
    expect(onlyDigits(formatPhone('163333333399999'))).toBe('16333333339');
  });
});

describe('validators', () => {
  it('valida CPF pelos dígitos verificadores', () => {
    expect(cpfValidator(new FormControl('529.982.247-25'))).toBeNull();
    expect(cpfValidator(new FormControl('111.111.111-11'))).toEqual({ cpf: true });
    expect(cpfValidator(new FormControl('123.456.789-00'))).toEqual({ cpf: true });
  });

  it('valida telefone com 10 ou 11 dígitos', () => {
    expect(phoneValidator(new FormControl('(11) 98765-4321'))).toBeNull();
    expect(phoneValidator(new FormControl('(11) 9876'))).toEqual({ phone: true });
  });

  it('aplica a política de senha da API', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true);
    expect(isStrongPassword('abcdef1!')).toBe(false);
    expect(isStrongPassword('Abc1!')).toBe(false);
    expect(isStrongPassword('Abcdefghijklmnopqrs1!')).toBe(false);
    expect(passwordPolicyValidator(new FormControl('semnumero!A'))).toEqual({
      passwordPolicy: true,
    });
  });

  it('compara a confirmação com a senha', () => {
    const form = new FormGroup({
      password: new FormControl('Abcdef1!'),
      confirm: new FormControl('outra', [sameAs('password')]),
    });
    expect(form.controls.confirm.errors).toEqual({ mismatch: true });
    form.controls.confirm.setValue('Abcdef1!');
    expect(form.controls.confirm.errors).toBeNull();
  });
});

describe('personNameValidator', () => {
  const check = (value: string) => personNameValidator(new FormControl(value));

  it('aceita nome e sobrenome com acento, partícula e apóstrofo', () => {
    ['Maria Silva', 'João da Silva', "Ana D'Ávila"].forEach((name) =>
      expect(check(name)).toBeNull(),
    );
  });

  it('recusa hífen, e-mail, números, símbolos e nome único', () => {
    ['Ana-Clara Souza', 'a@b.com', 'Maria123 Silva', 'Maria_Silva', 'Maria'].forEach((name) =>
      expect(check(name)).toEqual({ personName: true }),
    );
  });
});

describe('formatPersonName', () => {
  it('põe iniciais em maiúscula e mantém partículas em minúscula', () => {
    expect(formatPersonName('  JOÃO   DA silva ')).toBe('João da Silva');
    expect(formatPersonName('maria DE souza E lima')).toBe('Maria de Souza e Lima');
    expect(formatPersonName("ana d'ávila")).toBe("Ana D'Ávila");
  });
});

describe('formatNameInput', () => {
  it('remove o que não é nome e formata enquanto digita', () => {
    expect(formatNameInput('joão-123 d@a  silva')).toBe('João da Silva');
    expect(formatNameInput('  ana ')).toBe('Ana ');
    expect(formatNameInput('maria d’ávila')).toBe("Maria D'Ávila");
    expect(formatNameInput('Maria Di')).toBe('Maria Di');
    expect(formatNameInput('Maria di ')).toBe('Maria di ');
  });

  it('limpa e-mail de espaços e maiúsculas', () => {
    expect(formatEmailInput(' Ana@X.com ')).toBe('ana@x.com');
  });
});

describe('senha sem espaços', () => {
  it('recusa senha com espaço mesmo atendendo às regras', () => {
    expect(isStrongPassword('Abc def1!')).toBe(false);
    expect(isStrongPassword('Abcdef1!')).toBe(true);
  });
});
