import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { OwnerDashboard } from './owner-dashboard';

const rental = (id: string, status: string) => ({
  id,
  condominiumId: 'c1',
  condominiumName: 'Edifício A',
  parkingSpotId: 's1',
  parkingSpotNumber: '12',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  startHour: null,
  endHour: null,
  price: 80,
  total: 240,
  status,
});

describe('OwnerDashboard', () => {
  const summary = vi.fn();
  const list = vi.fn();
  const approve = vi.fn();
  const refuse = vi.fn();
  const confirm = vi.fn();
  const askReason = vi.fn();

  async function setup(spots: number, items = [rental('r1', 'PENDING')]) {
    summary
      .mockReset()
      .mockReturnValue(of({ spots, pending: 2, active: 1, upcoming: 3, monthEarnings: 150 }));
    list.mockReset().mockReturnValue(of(toPage(items, 0, 25, items.length)));
    approve.mockReset().mockReturnValue(of(undefined));
    refuse.mockReset().mockReturnValue(of(undefined));
    confirm.mockReset().mockReturnValue(of(true));
    askReason.mockReset().mockReturnValue(of('sem data'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OwnedRentalsApi, useValue: { summary, list, approve, refuse } },
        { provide: ConfirmService, useValue: { confirm, askReason } },
      ],
    });
    const fixture = TestBed.createComponent(OwnerDashboard);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('shows four KPIs with earnings and the rentals as a list', async () => {
    const { element } = await setup(2);
    expect(element.querySelectorAll('app-stat-card')).toHaveLength(4);
    expect(element.textContent).toContain('150,00');
    expect(element.querySelectorAll('li[appListItem]')).toHaveLength(1);
    expect(element.querySelector('table')).toBeNull();
    expect(element.textContent).toContain('Edifício A');
  });

  it('shows the empty state and no list when the user owns no spot', async () => {
    const { element } = await setup(0);
    expect(element.querySelector('app-empty-state')).not.toBeNull();
    expect(element.querySelector('app-stat-card')).toBeNull();
    expect(element.querySelector('app-list-state')).toBeNull();
  });

  it('filters by PENDING when the pending card is clicked', async () => {
    const { fixture, element } = await setup(2);
    element.querySelector<HTMLButtonElement>('app-stat-card button')!.click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(0, expect.any(Number), 'PENDING');
  });

  it('approves a pending rental after confirmation and reloads', async () => {
    const { fixture, element } = await setup(2);
    element.querySelector<HTMLButtonElement>('li button[data-variant="primary"]')!.click();
    await fixture.whenStable();
    expect(approve).toHaveBeenCalledWith('r1');
    expect(list).toHaveBeenCalledTimes(2);
    expect(summary).toHaveBeenCalledTimes(2);
  });

  it('refuses with the reason and does nothing when dismissed', async () => {
    const { fixture, element } = await setup(2);
    const buttons = element.querySelectorAll<HTMLButtonElement>('li button');
    buttons[1].click();
    await fixture.whenStable();
    expect(refuse).toHaveBeenCalledWith('r1', 'sem data');
    askReason.mockReturnValue(of(null));
    buttons[1].click();
    await fixture.whenStable();
    expect(refuse).toHaveBeenCalledTimes(1);
  });

  it('shows the error when the decision fails', async () => {
    const { fixture, element } = await setup(2);
    approve.mockReturnValue(throwError(() => new Error('falha')));
    element.querySelector<HTMLButtonElement>('li button[data-variant="primary"]')!.click();
    await fixture.whenStable();
    expect(element.querySelector('app-alert')).not.toBeNull();
  });

  it('offers decisions only for pending rentals', async () => {
    const { element } = await setup(2, [rental('r2', 'ACTIVE')]);
    expect(element.querySelectorAll('li button')).toHaveLength(0);
    expect(element.querySelector('li a[href="/parking-spots/s1"]')).not.toBeNull();
  });
});
