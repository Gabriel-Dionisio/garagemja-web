import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Chart } from './chart';

describe('Chart', () => {
  async function render(labels = ['Ativos', 'Pendentes', 'Outros'], data = [18, 1, 1]) {
    const fixture = TestBed.createComponent(Chart);
    fixture.componentRef.setInput('kind', 'share');
    fixture.componentRef.setInput('labels', labels);
    fixture.componentRef.setInput('series', [
      { label: 'Condomínios', data, tone: ['success', 'warning', 'muted'] },
    ]);
    fixture.componentRef.setInput('description', 'Condomínios por situação');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra o valor dentro dos setores grandes e na legenda de cada item', async () => {
    const root = await render();
    const segments = Array.from(root.querySelectorAll('.segment')).map((s) =>
      s.textContent?.trim(),
    );
    expect(segments).toEqual(['18', '', '']);
    const legend = Array.from(root.querySelectorAll('.legend button')).map((b) =>
      b.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(legend).toEqual(['Ativos1890%', 'Pendentes15%', 'Outros15%']);
  });

  it('alterna o destaque de um item pela legenda', async () => {
    const root = await render();
    const button = root.querySelector<HTMLButtonElement>('.legend button')!;
    button.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('volta a nenhum selecionado quando todos os itens são marcados', async () => {
    const root = await render();
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('.legend button'));
    buttons.forEach((b) => b.click());
    await TestBed.inject(ApplicationRef).whenStable();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false']);
  });

  it('não permite selecionar nem repete o percentual com um único item', async () => {
    const root = await render(['Ativos'], [5]);
    const button = root.querySelector<HTMLButtonElement>('.legend button')!;
    expect(button.disabled).toBe(true);
    expect(button.querySelector('.share')).toBeNull();
  });
});
