import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OwnerSummaryApi } from '../../data/owner-summary-api';
import { OwnerDashboard } from './owner-dashboard';

describe('OwnerDashboard', () => {
  const summary = vi.fn();

  async function setup(spots: number) {
    summary
      .mockReset()
      .mockReturnValue(of({ spots, pending: 2, active: 1, upcoming: 3, monthEarnings: 150 }));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: OwnerSummaryApi, useValue: { summary } }],
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
      providers: [provideRouter([]), { provide: OwnerSummaryApi, useValue: { summary } }],
    });
    const fixture = TestBed.createComponent(OwnerDashboard);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-alert')).not.toBeNull();
  });
});
