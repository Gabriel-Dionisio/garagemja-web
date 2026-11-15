import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { Page, toPage } from '../../../../shared/models/page';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { VehiclesApi } from '../../data/vehicles-api';
import { VehicleListItem } from '../../vehicle.model';
import { VehiclesPage } from './vehicles-page';

const item: VehicleListItem = {
  id: 'v1',
  residentId: 'r1',
  plate: 'ABC1234',
  brand: 'Honda',
  model: 'Civic',
  color: 'Prata',
  residency: {
    id: 'r1',
    condominiumId: 'c1',
    condominiumName: 'Residencial Aurora',
    unit: '101',
    block: 'A',
    approved: true,
  },
};

const pageOf = (items: VehicleListItem[]) => toPage(items, 0, 25, items.length);

describe('VehiclesPage', () => {
  const remove = vi.fn();
  const confirm = vi.fn();

  async function setup(result: Observable<Page<VehicleListItem>>) {
    const list = vi.fn().mockReturnValue(result);
    remove.mockReset().mockReturnValue(of(undefined));
    confirm.mockReset().mockReturnValue(of(true));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'vehicles', component: VehiclesPage }]),
        { provide: VehiclesApi, useValue: { list, remove } },
        { provide: ConfirmService, useValue: { confirm } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/vehicles');
    await harness.fixture.whenStable();
    return { list, root: harness.routeNativeElement as HTMLElement, harness };
  }

  it('renders each vehicle with plate, condominium and an edit link', async () => {
    const { root } = await setup(of(pageOf([item])));
    const text = root.textContent ?? '';
    expect(text).toContain('Honda Civic');
    expect(text).toContain('ABC-1234');
    expect(text).toContain('Residencial Aurora · A / 101');
    expect(root.querySelector<HTMLAnchorElement>('a[href="/vehicles/v1"]')).not.toBeNull();
  });

  it('links the header action to the registration form', async () => {
    const { root } = await setup(of(pageOf([item])));
    expect(root.querySelector('a[href="/vehicles/new"]')).not.toBeNull();
  });

  it('shows the empty state when there are no vehicles', async () => {
    const { root } = await setup(of(pageOf([])));
    expect(root.querySelector('app-empty-state')).not.toBeNull();
    expect(root.querySelector('li')).toBeNull();
  });

  it('removes the vehicle after confirmation and reloads', async () => {
    const { list, root, harness } = await setup(of(pageOf([item])));
    root.querySelector<HTMLButtonElement>('li button[data-variant="danger"]')?.click();
    await harness.fixture.whenStable();
    expect(remove).toHaveBeenCalledWith('v1');
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('does not remove when the confirmation is dismissed', async () => {
    const { root, harness } = await setup(of(pageOf([item])));
    confirm.mockReturnValue(of(false));
    root.querySelector<HTMLButtonElement>('li button[data-variant="danger"]')?.click();
    await harness.fixture.whenStable();
    expect(remove).not.toHaveBeenCalled();
  });

  it('shows an error alert when the list fails', async () => {
    const { root } = await setup(throwError(() => new Error('boom')));
    expect(root.querySelector('app-alert')).not.toBeNull();
  });
});
