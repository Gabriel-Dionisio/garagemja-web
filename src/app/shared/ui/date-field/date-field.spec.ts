import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { LocaleService } from '../../../core/i18n/locale-service';
import { DateField } from './date-field';

@Component({
  imports: [DateField],
  template: `<app-date-field label="Data" [(isoValue)]="value" [isoMax]="max()" />`,
})
class Host {
  readonly value = signal('2028-02-10');
  readonly max = signal<string | null>(null);
}

describe('DateField', () => {
  async function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideTransloco({ config: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' } }),
        { provide: LocaleService, useValue: { language: signal('pt-BR') } },
      ],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const open = async () => {
      root.querySelector<HTMLButtonElement>('.toggle')?.click();
      await fixture.whenStable();
    };
    return { fixture, root, open };
  }

  it('mostra a data no formato do idioma e abre o calendário no mês dela', async () => {
    const { root, open } = await setup();
    expect(root.querySelector('input')?.value).toBe('10/02/2028');
    await open();
    expect(root.querySelectorAll('.days button')).toHaveLength(29);
    expect(root.querySelector('.days .selected')?.textContent?.trim()).toBe('10');
  });

  it('escolher um dia atualiza o valor e fecha o calendário', async () => {
    const { fixture, root, open } = await setup();
    await open();
    root.querySelectorAll<HTMLButtonElement>('.days button')[28].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('2028-02-29');
    expect(root.querySelector('.popup')).toBeNull();
  });

  it('desabilita dias acima do máximo', async () => {
    const { fixture, root, open } = await setup();
    fixture.componentInstance.max.set('2028-02-15');
    await fixture.whenStable();
    await open();
    const days = root.querySelectorAll<HTMLButtonElement>('.days button');
    expect(days[14].disabled).toBe(false);
    expect(days[15].disabled).toBe(true);
  });
});
