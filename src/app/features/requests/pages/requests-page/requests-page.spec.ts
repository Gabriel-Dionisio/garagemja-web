import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { OwnedRentalsApi } from '../../data/owned-rentals-api';
import { OwnedRental } from '../../owned-rental.model';
import { RequestsPage } from './requests-page';

const rental = (overrides: Partial<OwnedRental> = {}): OwnedRental => ({
  id: 'r1',
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
  ownerAmount: 240,
  status: 'PENDING',
  cancelReason: null,
  renterName: 'Maria Souza',
  renterPhotoUrl: null,
  vehiclePlate: 'ABC1D23',
  vehicleBrand: 'Fiat',
  vehicleModel: 'Uno',
  ...overrides,
});

describe('RequestsPage', () => {
  const list = vi.fn();
  const approve = vi.fn();
  const refuse = vi.fn();
  const confirm = vi.fn();
  const askReason = vi.fn();

  async function setup(items: OwnedRental[] = [rental()]) {
    list.mockReset().mockReturnValue(of(toPage(items, 0, 25, items.length)));
    approve.mockReset().mockReturnValue(of(undefined));
    refuse.mockReset().mockReturnValue(of(undefined));
    confirm.mockReset().mockReturnValue(of(true));
    askReason.mockReset().mockReturnValue(of('sem data'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: OwnedRentalsApi, useValue: { list, approve, refuse } },
        { provide: ConfirmService, useValue: { confirm, askReason } },
      ],
    });
    const fixture = TestBed.createComponent(RequestsPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('lists pending requests with renter and vehicle', async () => {
    const { element } = await setup();
    expect(list).toHaveBeenCalledWith(0, expect.any(Number), 'PENDING', '');
    expect(element.textContent).toContain('Maria Souza');
    expect(element.textContent).toContain('Fiat Uno');
    expect(element.textContent).toContain('ABC');
    expect(element.textContent).toContain('Edifício A');
  });

  it('approves after confirmation and reloads', async () => {
    const { fixture, element } = await setup();
    const buttons = element.querySelectorAll<HTMLButtonElement>('li button');
    buttons[1].click();
    await fixture.whenStable();
    expect(approve).toHaveBeenCalledWith('r1');
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('refuses with the reason and does nothing when dismissed', async () => {
    const { fixture, element } = await setup();
    const refuseButton = element.querySelectorAll<HTMLButtonElement>('li button')[0];
    refuseButton.click();
    await fixture.whenStable();
    expect(refuse).toHaveBeenCalledWith('r1', 'sem data');
    askReason.mockReturnValue(of(null));
    refuseButton.click();
    await fixture.whenStable();
    expect(refuse).toHaveBeenCalledTimes(1);
  });

  it('shows the error when the decision fails', async () => {
    const { fixture, element } = await setup();
    approve.mockReturnValue(throwError(() => new Error('falha')));
    element.querySelectorAll<HTMLButtonElement>('li button')[1].click();
    await fixture.whenStable();
    expect(element.querySelector('app-alert')).not.toBeNull();
  });

  it('offers no decision for requests already decided and shows the reason', async () => {
    const { element } = await setup([rental({ status: 'REFUSED', cancelReason: 'sem data' })]);
    expect(element.querySelectorAll('li button')).toHaveLength(0);
    expect(element.textContent).toContain('sem data');
  });
});
