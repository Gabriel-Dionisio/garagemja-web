import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Page } from '../../../../shared/models/page';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { OwnedRental } from '../../../dashboard/owned-rental.model';
import { RequestsApi } from '../../data/requests-api';
import { REQUESTS_ROUTES } from '../../requests.routes';

const rental: OwnedRental = {
  id: 'r1',
  condominiumId: 'c1',
  condominiumName: 'Residencial Aurora',
  parkingSpotId: 's1',
  parkingSpotNumber: 'A-01',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  price: 8,
  status: 'PENDING',
};
const pageOf = (items: OwnedRental[]): Page<OwnedRental> => ({
  items,
  page: 0,
  size: 25,
  total: items.length,
  hasNext: false,
});

describe('RequestsPage', () => {
  async function setup(
    url: string,
    list: Observable<Page<OwnedRental>> = of(pageOf([rental])),
    confirmed = true,
  ) {
    const api = {
      list: vi.fn().mockReturnValue(list),
      decide: vi.fn().mockReturnValue(of(undefined)),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'requests', children: REQUESTS_ROUTES }],
          withComponentInputBinding(),
        ),
        { provide: RequestsApi, useValue: api },
        { provide: ConfirmService, useValue: { confirm: vi.fn().mockReturnValue(of(confirmed)) } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return { api, harness, root: harness.routeNativeElement as HTMLElement };
  }

  const buttons = (root: HTMLElement) =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('li button'));

  it('defaults to the pending tab', async () => {
    const { api, harness } = await setup('/requests');
    expect(api.list).toHaveBeenCalledWith(0, 25, 'PENDING');
    expect(harness.routeNativeElement?.querySelectorAll('app-tab-nav a')).toHaveLength(3);
  });

  it.each([
    ['approved', 'APPROVED'],
    ['refused', 'REFUSED'],
  ])('queries the %s tab with its own status', async (path, status) => {
    const { api } = await setup(`/requests/${path}`);
    expect(api.list).toHaveBeenCalledWith(0, 25, status);
  });

  it('offers approve and refuse on pending requests', async () => {
    const pending = await setup('/requests/pending');
    expect(buttons(pending.root)).toHaveLength(2);
  });

  it('offers no decision on approved requests', async () => {
    const approved = await setup(
      '/requests/approved',
      of(pageOf([{ ...rental, status: 'APPROVED' }])),
    );
    expect(approved.root.querySelectorAll('li')).toHaveLength(1);
    expect(buttons(approved.root)).toHaveLength(0);
  });

  it('approves after confirmation and reloads the list from the api', async () => {
    const { api, harness, root } = await setup('/requests/pending');
    const [, approve] = buttons(root);
    approve.click();
    await harness.fixture.whenStable();
    expect(api.decide).toHaveBeenCalledWith('r1', 'APPROVED');
    expect(api.list).toHaveBeenCalledTimes(2);
  });

  it('refuses after confirmation', async () => {
    const { api, harness, root } = await setup('/requests/pending');
    const [refuse] = buttons(root);
    refuse.click();
    await harness.fixture.whenStable();
    expect(api.decide).toHaveBeenCalledWith('r1', 'REFUSED');
  });

  it('does nothing when the confirmation is dismissed', async () => {
    const { api, harness, root } = await setup('/requests/pending', of(pageOf([rental])), false);
    buttons(root)[1].click();
    await harness.fixture.whenStable();
    expect(api.decide).not.toHaveBeenCalled();
    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('shows the api error and keeps the list when a decision fails', async () => {
    const { api, harness, root } = await setup('/requests/pending');
    api.decide.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    buttons(root)[1].click();
    await harness.fixture.whenStable();
    expect(root.querySelector('app-alert')).not.toBeNull();
    expect(root.querySelectorAll('li')).toHaveLength(1);
    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('blocks repeated decisions while one is in flight', async () => {
    const { api, harness, root } = await setup('/requests/pending');
    api.decide.mockReturnValue(new Subject<void>());
    buttons(root)[1].click();
    await harness.fixture.whenStable();
    expect(buttons(root).every((button) => button.disabled)).toBe(true);
    buttons(root)[1].click();
    expect(api.decide).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state for a tab without requests', async () => {
    const { root } = await setup('/requests/refused', of(pageOf([])));
    expect(root.querySelector('app-empty-state')).not.toBeNull();
  });

  it('shows an error with retry when loading fails', async () => {
    const { api, harness, root } = await setup(
      '/requests/pending',
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    expect(root.querySelector('app-alert')).not.toBeNull();
    api.list.mockReturnValue(of(pageOf([rental])));
    root.querySelector<HTMLButtonElement>('app-alert button')?.click();
    await harness.fixture.whenStable();
    expect(root.querySelector('app-alert')).toBeNull();
    expect(root.querySelectorAll('li')).toHaveLength(1);
  });
});
