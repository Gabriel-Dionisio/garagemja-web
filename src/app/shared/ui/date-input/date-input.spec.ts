import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocaleService } from '../../../core/i18n/locale-service';
import { DateInput } from './date-input';

@Component({
  imports: [DateInput],
  template: `<input appDateInput [(isoValue)]="value" [isoMax]="max()" />`,
})
class Host {
  readonly value = signal('');
  readonly max = signal<string | null>(null);
}

describe('DateInput', () => {
  const language = signal<'pt-BR' | 'en'>('pt-BR');

  async function setup() {
    TestBed.configureTestingModule({
      providers: [{ provide: LocaleService, useValue: { language } }],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const type = async (text: string) => {
      input.value = text;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    return { fixture, input, type };
  }

  beforeEach(() => language.set('pt-BR'));

  it('usa dd/MM/yyyy em português e guarda ISO', async () => {
    const { fixture, input, type } = await setup();
    expect(input.placeholder).toBe('dd/mm/yyyy');
    await type('08112026');
    expect(input.value).toBe('08/11/2026');
    expect(fixture.componentInstance.value()).toBe('2026-11-08');
  });

  it('usa MM/dd/yyyy em inglês', async () => {
    language.set('en');
    const { fixture, input, type } = await setup();
    await type('11082026');
    expect(input.value).toBe('11/08/2026');
    expect(fixture.componentInstance.value()).toBe('2026-11-08');
  });

  it('mostra um valor ISO vindo de fora e troca o formato com o idioma', async () => {
    const { fixture, input } = await setup();
    fixture.componentInstance.value.set('2026-11-08');
    await fixture.whenStable();
    expect(input.value).toBe('08/11/2026');
    language.set('en');
    await fixture.whenStable();
    expect(input.value).toBe('11/08/2026');
  });

  it('não aceita data fora do limite nem incompleta, sem apagar o texto', async () => {
    const { fixture, input, type } = await setup();
    fixture.componentInstance.max.set('2026-01-01');
    await fixture.whenStable();
    await type('08112026');
    expect(fixture.componentInstance.value()).toBe('');
    expect(input.value).toBe('08/11/2026');
    await type('0811');
    expect(fixture.componentInstance.value()).toBe('');
  });

  it('setas ajustam a parte sob o cursor e respeitam o mês', async () => {
    const { fixture, input, type } = await setup();
    await type('28022026');
    input.setSelectionRange(1, 1);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(input.value).toBe('01/03/2026');
    input.setSelectionRange(8, 8);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('2025-03-01');
  });

  it('seta num campo vazio começa em hoje', async () => {
    const { fixture, input } = await setup();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
