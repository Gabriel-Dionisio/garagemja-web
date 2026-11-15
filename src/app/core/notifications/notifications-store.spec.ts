import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { toPage } from '../../shared/models/page';
import { AppNotification } from './notification.model';
import { NotificationStream } from './notification-stream';
import { NotificationsApi } from './notifications-api';
import { NotificationsStore } from './notifications-store';

const item = (id: string): AppNotification => ({
  id,
  kind: 'RENTAL_REQUESTED',
  condominiumName: 'Solar',
  reason: null,
  createdAt: '2026-11-15T12:00:00Z',
  read: false,
});

describe('NotificationsStore', () => {
  const events = new Subject<AppNotification>();
  const api = {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markAllRead: vi.fn(),
  };

  function setup(): NotificationsStore {
    api.list.mockReset().mockReturnValue(of(toPage([item('a')], 0, 20, 1)));
    api.unreadCount.mockReset().mockReturnValue(of(2));
    api.markAllRead.mockReset().mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationsApi, useValue: api },
        {
          provide: NotificationStream,
          useValue: {
            connect: (onOpen: () => void) => {
              onOpen();
              return events;
            },
          },
        },
      ],
    });
    return TestBed.inject(NotificationsStore);
  }

  it('fetches the unread count once and counts pushed notifications', () => {
    const store = setup();
    store.start();
    store.start();
    expect(api.unreadCount).toHaveBeenCalledTimes(1);
    expect(store.unread()).toBe(2);
    events.next(item('b'));
    expect(store.unread()).toBe(3);
    store.stop();
  });

  it('marks everything read when the panel opens and prepends pushes while open', () => {
    const store = setup();
    store.start();
    store.open();
    expect(store.items().map((n) => n.id)).toEqual(['a']);
    expect(api.markAllRead).toHaveBeenCalledTimes(1);
    expect(store.unread()).toBe(0);
    events.next(item('b'));
    expect(store.items().map((n) => n.id)).toEqual(['b', 'a']);
    expect(store.unread()).toBe(0);
    store.stop();
  });

  it('loads more without duplicating and clears everything on stop', () => {
    const store = setup();
    api.list
      .mockReturnValueOnce(of(toPage([item('a')], 0, 20, 40)))
      .mockReturnValueOnce(of(toPage([item('a'), item('c')], 1, 20, 40)));
    store.start();
    store.open();
    store.loadMore();
    expect(store.items().map((n) => n.id)).toEqual(['a', 'c']);
    store.stop();
    expect(store.items()).toEqual([]);
    expect(store.unread()).toBe(0);
    expect(store.hasNext()).toBe(false);
  });

  it('ignores a push already in the list', () => {
    const store = setup();
    store.start();
    store.open();
    events.next(item('a'));
    expect(store.items().map((n) => n.id)).toEqual(['a']);
    store.stop();
  });
});
