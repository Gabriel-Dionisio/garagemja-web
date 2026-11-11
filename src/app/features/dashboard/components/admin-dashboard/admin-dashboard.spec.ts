import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { Chart } from '../../../../shared/ui/chart/chart';
import { PlatformSummaryApi } from '../../data/platform-summary-api';
import { AdminDashboard } from './admin-dashboard';

@Component({ selector: 'app-chart', template: '' })
class ChartStub {
  readonly kind = input<string>();
  readonly labels = input<readonly string[]>();
  readonly series = input<unknown>();
  readonly description = input<string>();
  readonly xLabel = input<string>();
  readonly yLabel = input<string>();
}

describe('AdminDashboard', () => {
  const summary = vi.fn();
  const condominiums = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTransloco({ config: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' } }),
        { provide: PlatformSummaryApi, useValue: { users: summary, condominiums } },
      ],
    }).overrideComponent(AdminDashboard, {
      remove: { imports: [Chart] },
      add: { imports: [ChartStub] },
    });
    return TestBed.createComponent(AdminDashboard);
  }

  it('mostra totais de usuários e condomínios e dois gráficos', async () => {
    summary.mockReturnValue(of({ total: 9, active: 5, blocked: 1 }));
    condominiums.mockReturnValue(of({ total: 4, active: 2, pending: 1, blocked: 1 }));
    const fixture = create();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('app-stat-card')).toHaveLength(7);
    expect(root.querySelectorAll('.kpi.highlight')).toHaveLength(1);
    expect(root.querySelectorAll('app-chart')).toHaveLength(2);
  });

  it('mostra erro quando o carregamento falha', async () => {
    summary.mockReturnValue(throwError(() => new Error('falha')));
    condominiums.mockReturnValue(of({ total: 0, active: 0, pending: 0, blocked: 0 }));
    const fixture = create();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-alert')).not.toBeNull();
  });
});
