import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { toPage } from '../../shared/models/page';
import { AppNotification } from './notification.model';
import { NotificationStream, StreamRejected } from './notification-stream';
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
    markRead: vi.fn(),
  };

  function setup(connect = (onOpen: () => void) => (onOpen(), events)): NotificationsStore {
    api.list.mockReset().mockReturnValue(of(toPage([item('a')], 0, 20, 1)));
    api.unreadCount.mockReset().mockReturnValue(of(2));
    api.markAllRead.mockReset().mockReturnValue(of(undefined));
    api.markRead.mockReset().mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: NotificationsApi, useValue: api },
        {
          provide: NotificationStream,
          useValue: { connect },
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

  it('reconnects after a 401 once the session refresh call succeeds', () => {
    vi.useFakeTimers();
    const connect = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new StreamRejected(401)))
      .mockReturnValue(events);
    const store = setup(connect);
    store.start();
    vi.advanceTimersByTime(1000);
    expect(api.unreadCount).toHaveBeenCalledTimes(3);
    expect(connect).toHaveBeenCalledTimes(2);
    store.stop();
    vi.useRealTimers();
  });

  it('stops reconnecting after a 401 when the session cannot be refreshed', () => {
    vi.useFakeTimers();
    const connect = vi.fn().mockReturnValue(throwError(() => new StreamRejected(401)));
    const store = setup(connect);
    api.unreadCount.mockReturnValueOnce(of(0)).mockReturnValue(throwError(() => new Error('401')));
    store.start();
    vi.advanceTimersByTime(60_000);
    expect(connect).toHaveBeenCalledTimes(1);
    store.stop();
    vi.useRealTimers();
  });

  it('keeps unread on open, counts pushes and prepends them while open', () => {
    const store = setup();
    store.start();
    store.open();
    expect(store.items().map((n) => n.id)).toEqual(['a']);
    expect(api.markAllRead).not.toHaveBeenCalled();
    expect(store.unread()).toBe(2);
    events.next(item('b'));
    expect(store.items().map((n) => n.id)).toEqual(['b', 'a']);
    expect(store.unread()).toBe(3);
    store.stop();
  });

  it('marks one notification read and decrements the counter once', () => {
    const store = setup();
    store.start();
    store.open();
    store.markRead('a');
    store.markRead('a');
    expect(api.markRead).toHaveBeenCalledTimes(1);
    expect(api.markRead).toHaveBeenCalledWith('a');
    expect(store.items()[0].read).toBe(true);
    expect(store.unread()).toBe(1);
    store.markAllRead();
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

  it('retries the same page after a failed load more and keeps the loaded items', () => {
    const store = setup();
    api.list
      .mockReturnValueOnce(of(toPage([item('a')], 0, 20, 40)))
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(toPage([item('c')], 1, 20, 40)));
    store.open();
    store.loadMore();
    expect(store.items().map((n) => n.id)).toEqual(['a']);
    store.loadMore();
    expect(api.list).toHaveBeenLastCalledWith(1, expect.any(Number));
    expect(store.items().map((n) => n.id)).toEqual(['a', 'c']);
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
