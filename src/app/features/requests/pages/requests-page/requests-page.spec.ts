import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toPage } from '../../../../shared/models/page';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { OwnedRentalsApi } from '../../../../shared/rentals/owned-rentals-api';
import { OwnedRental } from '../../../../shared/rentals/owned-rental.model';
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
  renterUserId: 'renter-user',
  renterName: 'Maria Souza',
  renterPhotoUrl: null,
  vehiclePlate: 'ABC1D23',
  vehicleBrand: 'Fiat',
  vehicleModel: 'Uno',
  paid: false,
  paymentPending: false,
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
    expect(element.textContent).toContain('Edifício A');
  });

  it('approves after confirmation and reloads', async () => {
    const { fixture, element } = await setup();
    element.querySelector<HTMLButtonElement>('li .actions button:not([appIconButton])')!.click();
    await fixture.whenStable();
    expect(approve).toHaveBeenCalledWith('r1');
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('refuses with the reason and does nothing when dismissed', async () => {
    const { fixture, element } = await setup();
    const refuseButton = element.querySelector<HTMLButtonElement>('button[aria-label="Recusar"]')!;
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
    element.querySelector<HTMLButtonElement>('li .actions button:not([appIconButton])')!.click();
    await fixture.whenStable();
    expect(element.querySelector('app-alert')).not.toBeNull();
  });

  it('gives the icon actions an accessible name', async () => {
    const { element } = await setup();
    const icon = element.querySelector('button[appIconButton]');
    expect(icon?.getAttribute('aria-label')).toBe('Recusar');
  });

  it('opens the details dialog on click with reason and profile link, not on the icon', async () => {
    const { fixture, element } = await setup([
      rental({ status: 'REFUSED', cancelReason: 'sem data' }),
    ]);
    expect(element.querySelectorAll('li .actions button')).toHaveLength(0);
    element.querySelector<HTMLButtonElement>('li button.main')!.click();
    await fixture.whenStable();
    const dialog = document.querySelector('app-rental-details-dialog')!;
    expect(dialog.textContent).toContain('sem data');
    expect(dialog.textContent).toContain('Maria Souza');
    expect(dialog.textContent).toContain('Fiat Uno');
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('/users/renter-user/profile');
    expect(document.querySelector('#rental-details-title')).not.toBeNull();
  });

  it('does not open the dialog when an icon action is used', async () => {
    const { fixture, element } = await setup();
    element.querySelector<HTMLButtonElement>('button[aria-label="Recusar"]')!.click();
    await fixture.whenStable();
    expect(document.querySelector('app-rental-details-dialog')).toBeNull();
  });
});
