import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Chart } from '../../../../shared/ui/chart/chart';
import { PeriodChart } from '../../../../shared/ui/chart/period-chart';
import { OwnerSummaryApi } from '../../data/owner-summary-api';
import { StatsApi } from '../../data/stats-api';
import { OwnerDashboard } from './owner-dashboard';

@Component({ selector: 'app-chart', template: '' })
class ChartStub {
  readonly kind = input<string>();
  readonly labels = input<readonly string[]>();
  readonly series = input<{ label: string; data: number[] }[]>();
  readonly description = input<string>();
  readonly xLabel = input<string>();
  readonly yLabel = input<string>();
  readonly format = input<unknown>();
  readonly showValues = input<boolean>();
}

describe('OwnerDashboard', () => {
  const summary = vi.fn();
  const myRentals = vi.fn();

  beforeEach(() => {
    myRentals.mockReset().mockReturnValue(
      of([
        { start: '2026-09', received: 0, made: 0 },
        { start: '2026-11', received: 3, made: 1 },
      ]),
    );
    TestBed.overrideComponent(PeriodChart, {
      remove: { imports: [Chart] },
      add: { imports: [ChartStub] },
    });
  });

  async function setup(spots: number) {
    summary
      .mockReset()
      .mockReturnValue(of({ spots, pending: 2, active: 1, upcoming: 3, monthEarnings: 150 }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OwnerSummaryApi, useValue: { summary } },
        { provide: StatsApi, useValue: { myRentals } },
      ],
    });
    const fixture = TestBed.createComponent(OwnerDashboard);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows only the four KPIs, with earnings', async () => {
    const { element } = await setup(2);
    expect(element.querySelectorAll('app-stat-card')).toHaveLength(4);
    expect(element.textContent).toContain('150,00');
    expect(element.querySelector('app-list-state')).toBeNull();
  });

  it('links the pending KPI to the pending requests', async () => {
    const { element } = await setup(2);
    const link = element.querySelector<HTMLAnchorElement>('app-stat-card a');
    expect(link?.getAttribute('href')).toBe('/requests?status=PENDING');
  });

  it('shows the empty state when the user owns no spot', async () => {
    const { element } = await setup(0);
    expect(element.querySelector('app-empty-state')).not.toBeNull();
    expect(element.querySelector('app-stat-card')).toBeNull();
  });

  it('shows the error when the summary fails', async () => {
    summary.mockReturnValue(throwError(() => new Error('falha')));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OwnerSummaryApi, useValue: { summary } },
        { provide: StatsApi, useValue: { myRentals } },
      ],
    });
    const fixture = TestBed.createComponent(OwnerDashboard);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-alert')).not.toBeNull();
  });

  it('charts rentals received and made by month', async () => {
    const { fixture } = await setup(2);
    expect(myRentals).toHaveBeenCalledWith('MONTH');
    const chart = fixture.debugElement.query((node) => node.componentInstance instanceof ChartStub)
      .componentInstance as ChartStub;
    expect(chart.series()?.map((series) => series.label)).toEqual([
      'Pedidos recebidos',
      'Pedidos feitos',
    ]);
    expect(chart.series()?.[0].data).toEqual([0, 3]);
    expect(chart.labels()).toHaveLength(2);
  });

  it('keeps the rentals chart for a renter without spots and reloads by period', async () => {
    const { fixture, element } = await setup(0);
    const periods = element.querySelectorAll<HTMLButtonElement>('app-period-chart button');
    periods[1].click();
    await fixture.whenStable();
    expect(myRentals).toHaveBeenLastCalledWith('BIMESTER');
  });

  it('shows the empty chart state when there are no rentals in the period', async () => {
    myRentals.mockReturnValue(of([{ start: '2026-11', received: 0, made: 0 }]));
    const { element } = await setup(2);
    expect(element.querySelector('app-period-chart app-empty-state')?.textContent).toContain(
      'Nenhum aluguel neste período',
    );
  });
});
