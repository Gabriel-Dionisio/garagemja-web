import { DialogRef } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AppNotification } from '../notification.model';
import { NotificationsStore } from '../notifications-store';
import { NotificationPanel } from './notification-panel';

const item = (overrides: Partial<AppNotification> = {}): AppNotification => ({
  id: 'n1',
  kind: 'RENTAL_REFUSED',
  condominiumName: 'Solar',
  reason: 'sem data',
  createdAt: '2026-11-15T12:00:00Z',
  read: false,
  ...overrides,
});

describe('NotificationPanel', () => {
  const items = signal<AppNotification[]>([]);
  const store = {
    items,
    hasNext: signal(false),
    loading: signal(false),
    error: { text: () => null },
    open: vi.fn(),
    close: vi.fn(),
    loadMore: vi.fn(),
  };
  const closed = new Subject<void>();
  const ref = { close: vi.fn(() => closed.next()), closed };

  function setup(list: AppNotification[]) {
    items.set(list);
    store.open.mockReset();
    store.close.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationsStore, useValue: store },
        { provide: DialogRef, useValue: ref },
      ],
    });
    const fixture = TestBed.createComponent(NotificationPanel);
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('loads on open and lists the message with the reason', async () => {
    const { fixture, element } = setup([item()]);
    await fixture.whenStable();
    expect(store.open).toHaveBeenCalled();
    expect(element.textContent).toContain('Solar');
    expect(element.textContent).toContain('sem data');
  });

  it('shows the empty state and tells the store when closed', async () => {
    const { fixture, element } = setup([]);
    await fixture.whenStable();
    expect(element.querySelector('app-empty-state')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('header button')?.click();
    expect(store.close).toHaveBeenCalled();
  });
});
