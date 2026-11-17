import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationsApi, toNotification } from './notifications-api';

const row = {
  id: 'n1',
  kind: 'RENTAL_REFUSED',
  condominiumName: 'Solar',
  reason: 'sem data',
  createdAt: '2026-11-15T12:00:00Z',
  read: false,
};

describe('NotificationsApi', () => {
  let api: NotificationsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(NotificationsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps the page and the total from the header', () => {
    let result: unknown;
    api.list(0, 20).subscribe((page) => (result = page));
    const request = http.expectOne('/api/v1/me/notifications?page=0&size=20');
    request.flush([row], { headers: { 'X-Total-Count': '41' } });
    expect(result).toMatchObject({
      total: 41,
      hasNext: true,
      items: [{ id: 'n1', reason: 'sem data' }],
    });
  });

  it('reads the unread count and marks all read', () => {
    let count = -1;
    api.unreadCount().subscribe((value) => (count = value));
    http.expectOne('/api/v1/me/notifications/unread-count').flush({ count: 3 });
    expect(count).toBe(3);
    api.markAllRead().subscribe();
    expect(http.expectOne('/api/v1/me/notifications/read').request.method).toBe('POST');
  });

  it('rejects an unknown kind', () => {
    expect(() => toNotification({ ...row, kind: 'OTHER' })).toThrow();
  });
});
