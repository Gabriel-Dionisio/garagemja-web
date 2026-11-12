import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { formatCpf } from '../../forms/masks';
import { TextField } from './text-field';

@Component({
  imports: [TextField],
  template: `<app-text-field
    label="CPF"
    hint="Somente números"
    [format]="format"
    [control]="control"
  />`,
})
class Host {
  readonly control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  readonly format = formatCpf;
}

describe('TextField', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, element, input: element.querySelector('input') as HTMLInputElement };
  }

  it('associa label, dica e campo', async () => {
    const { element, input } = await setup();
    const label = element.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-describedby')).toContain('-hint');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('não mostra erro ao sair do campo sem ter digitado', async () => {
    const { fixture, element, input } = await setup();
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect((element.querySelector('.error') as HTMLElement).textContent?.trim()).toBe('');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('mostra o erro ligado ao campo depois de digitar e apagar', async () => {
    const { fixture, element, input } = await setup();
    input.value = '1';
    input.dispatchEvent(new Event('input'));
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    const error = element.querySelector('.error') as HTMLElement;
    expect(error.textContent).toContain('Campo obrigatório');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
  });

  it('espera uma pausa na digitação antes de mostrar o erro', async () => {
    const { fixture, element, input } = await setup();
    input.value = '1';
    input.dispatchEvent(new Event('input'));
    input.value = '';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect((element.querySelector('.error') as HTMLElement).textContent).toBe('');
  });

  it('aplica a máscara ao digitar', async () => {
    const { fixture, input } = await setup();
    input.value = '12345678901';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('123.456.789-01');
    expect(input.value).toBe('123.456.789-01');
  });

  it('mostra o contador n/máx só quando showCount está ligado', async () => {
    @Component({
      imports: [TextField],
      template: `<app-text-field label="Nome" [maxLength]="10" showCount [control]="control" />`,
    })
    class Counted {
      readonly control = new FormControl('abc', { nonNullable: true });
    }
    const fixture = TestBed.createComponent(Counted);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.count')?.textContent).toBe('3/10');
    fixture.componentInstance.control.setValue('abcde');
    await fixture.whenStable();
    expect(element.querySelector('.count')?.textContent).toBe('5/10');
  });

  it('não mostra contador por padrão', async () => {
    const { element } = await setup();
    expect(element.querySelector('.count')).toBeNull();
  });
});
