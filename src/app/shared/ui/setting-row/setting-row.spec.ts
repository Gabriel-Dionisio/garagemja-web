import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SettingRow } from './setting-row';

@Component({
  imports: [SettingRow],
  template: `<app-setting-row label="Tema" [hint]="hint"><button>x</button></app-setting-row>`,
})
class Host {
  hint: string | undefined = 'Ajuda';
}

describe('SettingRow', () => {
  it('mostra rótulo, dica e o controle projetado', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.label')?.textContent).toBe('Tema');
    expect(element.querySelector('.hint')?.textContent).toBe('Ajuda');
    expect(element.querySelector('.control button')).not.toBeNull();
  });

  it('omite a dica quando ausente', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.hint = undefined;
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.hint')).toBeNull();
  });
});
