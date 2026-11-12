import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { RentalsList } from './rentals-list';

describe('RentalsList', () => {
  const list = vi.fn();
  const rented = vi.fn();

  async function setup(mode: 'owned' | 'rented', hideWhenEmpty = false, items: unknown[] = []) {
    list.mockReset().mockReturnValue(of(toPage(items, 0, 25, items.length)));
    rented.mockReset().mockReturnValue(of(toPage(items, 0, 25, items.length)));
    TestBed.configureTestingModule({
      providers: [{ provide: OwnedRentalsApi, useValue: { list, rented } }],
    });
    const fixture = TestBed.createComponent(RentalsList);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('hideWhenEmpty', hideWhenEmpty);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('asks the API for the chosen status and goes back to the first page', async () => {
    const { fixture, element } = await setup('owned');
    const chips = element.querySelectorAll('app-chip-toggle button');
    (chips[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(0, expect.any(Number), 'PENDING');
  });

  it('uses the renter endpoint in rented mode', async () => {
    await setup('rented');
    expect(rented).toHaveBeenCalledWith(0, expect.any(Number), null);
    expect(list).not.toHaveBeenCalled();
  });

  it('renders nothing when hidden while empty and unfiltered', async () => {
    const { element } = await setup('rented', true);
    expect(element.querySelector('app-chip-toggle')).toBeNull();
    expect(element.querySelector('app-empty-state')).toBeNull();
  });
});
