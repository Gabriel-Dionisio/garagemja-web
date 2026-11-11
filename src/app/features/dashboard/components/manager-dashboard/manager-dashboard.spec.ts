import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { of } from 'rxjs';
import { Chart } from '../../../../shared/ui/chart/chart';
import { ManagedCondominiumsApi } from '../../data/managed-condominiums-api';
import { ManagedCondominium } from '../../managed-condominium.model';
import { ManagerDashboard } from './manager-dashboard';

@Component({ selector: 'app-chart', template: '' })
class ChartStub {
  readonly kind = input<string>();
  readonly labels = input<readonly string[]>();
  readonly series = input<unknown>();
  readonly description = input<string>();
  readonly xLabel = input<string>();
  readonly yLabel = input<string>();
}

const item = (id: string, overrides: Partial<ManagedCondominium> = {}) =>
  ({
    id,
    name: `Edifício ${id}`,
    status: 'ACTIVE',
    residents: 10,
    pendingResidents: 1,
    parkingSpots: 4,
    activeRentals: 1,
    resides: true,
    ...overrides,
  }) as ManagedCondominium;

async function render(items: ManagedCondominium[]) {
  const managed = vi.fn(() => of(items));
  const becomeResident = vi.fn(() => of(undefined));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideTransloco({ config: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' } }),
      { provide: ManagedCondominiumsApi, useValue: { list: managed, becomeResident } },
    ],
  }).overrideComponent(ManagerDashboard, {
    remove: { imports: [Chart] },
    add: { imports: [ChartStub] },
  });
  const fixture = TestBed.createComponent(ManagerDashboard);
  await fixture.whenStable();
  return { element: fixture.nativeElement as HTMLElement, managed, becomeResident };
}

describe('ManagerDashboard', () => {
  it('soma só os condomínios ativos nos totais', async () => {
    const { element, managed } = await render([
      item('a'),
      item('b', { pendingResidents: 2 }),
      item('c', { status: 'PENDING', residents: 99 }),
    ]);
    const values = Array.from(element.querySelectorAll('.kpi .value')).map((v) => v.textContent);
    expect(values).toEqual(['3', '20', '8', '2']);
    expect(element.querySelectorAll('app-chart')).toHaveLength(2);
    expect(managed).toHaveBeenCalledWith(100);
  });

  it('não mostra totais quando nenhum condomínio está ativo', async () => {
    const { element } = await render([item('a', { status: 'PENDING' })]);
    expect(element.querySelector('app-stat-card')).toBeNull();
    expect(element.querySelectorAll('app-chart')).toHaveLength(1);
  });

  it('oferece vincular como morador nos ativos sem vínculo', async () => {
    const { element, becomeResident } = await render([item('a', { resides: false })]);
    element.querySelector<HTMLButtonElement>('.notice button')!.click();
    expect(becomeResident).toHaveBeenCalledWith('a');
  });
});
