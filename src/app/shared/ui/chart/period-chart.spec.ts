import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Chart } from './chart';
import { PeriodChart } from './period-chart';

@Component({ selector: 'app-chart', template: '' })
class ChartStub {
  readonly kind = input<string>();
  readonly labels = input<readonly string[]>();
  readonly series = input<unknown>();
  readonly description = input<string>();
  readonly xLabel = input<string>();
  readonly yLabel = input<string>();
  readonly format = input<unknown>();
  readonly showValues = input<boolean>();
}

describe('PeriodChart', () => {
  beforeEach(() => {
    TestBed.overrideComponent(PeriodChart, {
      remove: { imports: [Chart] },
      add: { imports: [ChartStub] },
    });
  });

  async function render(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(PeriodChart);
    const values: Record<string, unknown> = {
      heading: 'Aluguéis por período',
      period: 'MONTH',
      labels: ['out', 'nov'],
      series: [{ label: 'Recebidos', data: [0, 2], tone: 'primary' }],
      loadingLabel: 'Carregando',
      emptyText: 'Nada no período',
      ...inputs,
    };
    Object.entries(values).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    const emitted: string[] = [];
    fixture.componentInstance.periodChange.subscribe((period) => emitted.push(period));
    await fixture.whenStable();
    return { root: fixture.nativeElement as HTMLElement, emitted };
  }

  it('mostra o gráfico e os três períodos com mês marcado', async () => {
    const { root } = await render();
    expect(root.querySelector('h2')?.textContent).toBe('Aluguéis por período');
    expect(root.querySelector('app-chart')).not.toBeNull();
    const chips = Array.from(root.querySelectorAll('app-chip-group button'));
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Mês', 'Bimestre', 'Ano']);
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('emite o período escolhido e ignora o atual', async () => {
    const { root, emitted } = await render();
    const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('app-chip-group button'));
    chips[0].click();
    chips[2].click();
    expect(emitted).toEqual(['YEAR']);
  });

  it('mostra carregando, erro e vazio no lugar do gráfico', async () => {
    expect(
      (await render({ loading: true })).root.querySelector('app-loading-block'),
    ).not.toBeNull();
    const failed = (await render({ error: 'Falhou' })).root;
    expect(failed.querySelector('app-alert')?.textContent).toContain('Falhou');
    const empty = (await render({ series: [{ label: 'R', data: [0, 0], tone: 'primary' }] })).root;
    expect(empty.querySelector('app-empty-state')?.textContent).toContain('Nada no período');
    expect(empty.querySelector('app-chart')).toBeNull();
  });
});
