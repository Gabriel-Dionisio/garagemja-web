import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { PasswordField } from './password-field';

@Component({
  imports: [PasswordField],
  template: `<app-password-field label="Senha" [control]="control" [showRules]="true" />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true });
}

describe('PasswordField rules', () => {
  it('esconde as regras atendidas e mantém só as que faltam durante a digitação', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = 'Abc';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    const states = Array.from(element.querySelectorAll('li')).map((item) =>
      item.getAttribute('data-state'),
    );
    expect(states).toEqual(['pending', 'pending', 'pending']);
  });

  it('mostra as pendentes como não atendidas depois do blur', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = 'Abc';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    const states = Array.from(element.querySelectorAll('li')).map((item) =>
      item.getAttribute('data-state'),
    );
    expect(states).toEqual(['unmet', 'unmet', 'unmet']);
  });
});

@Component({
  imports: [PasswordField],
  template: `<app-password-field label="Confirmar" [control]="confirm" [matchWith]="password" />`,
})
class ConfirmHost {
  readonly password = new FormControl('Abcdef1!', { nonNullable: true });
  readonly confirm = new FormControl('', { nonNullable: true });
}

describe('PasswordField match', () => {
  async function type(value: string, blur = false) {
    const fixture = TestBed.createComponent(ConfirmHost);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    if (blur) input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    return { input, state: element.querySelector('.match')?.getAttribute('data-state') };
  }

  it('fica pendente enquanto o texto é o começo da senha', async () => {
    expect((await type('Abc')).state).toBe('pending');
  });

  it('marca igual com borda verde', async () => {
    const { input, state } = await type('Abcdef1!');
    expect(state).toBe('met');
    expect(input.getAttribute('data-match')).toBe('met');
  });

  it('marca diferente ao sair do campo e invalida o input', async () => {
    const { input, state } = await type('Abc', true);
    expect(state).toBe('unmet');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
