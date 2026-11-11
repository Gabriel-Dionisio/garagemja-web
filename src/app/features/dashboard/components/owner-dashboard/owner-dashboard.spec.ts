import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { OwnerDashboard } from './owner-dashboard';

describe('OwnerDashboard', () => {
  const summary = vi.fn();
  const list = vi.fn();

  async function setup(spots: number) {
    summary
      .mockReset()
      .mockReturnValue(of({ spots, pending: 2, active: 1, upcoming: 3, monthEarnings: 150 }));
    list.mockReset().mockReturnValue(
      of(
        toPage(
          [
            {
              id: 'r1',
              condominiumId: 'c1',
              condominiumName: 'Edifício A',
              parkingSpotId: 's1',
              parkingSpotNumber: '12',
              startDate: '2026-11-10',
              endDate: '2026-11-12',
              price: 80,
              status: 'PENDING',
            },
          ],
          0,
          25,
          1,
        ),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: OwnedRentalsApi, useValue: { summary, list } }],
    });
    const fixture = TestBed.createComponent(OwnerDashboard);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows KPIs, earnings and the rentals of the owned spots', async () => {
    const element = await setup(2);
    expect(element.querySelectorAll('app-stat-card')).toHaveLength(4);
    expect(element.textContent).toContain('150.00');
    expect(element.textContent).toContain('Edifício A');
  });

  it('shows the empty state when the user owns no spot', async () => {
    const element = await setup(0);
    expect(element.querySelector('app-empty-state')).not.toBeNull();
    expect(element.querySelector('app-stat-card')).toBeNull();
  });
});
