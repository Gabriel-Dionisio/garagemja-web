import { Dialog } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotificationsStore } from '../notifications-store';
import { NotificationBell } from './notification-bell';

describe('NotificationBell', () => {
  const unread = signal(0);
  const start = vi.fn();
  const stop = vi.fn();
  const open = vi.fn();

  function setup() {
    unread.set(0);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: NotificationsStore, useValue: { unread, start, stop } },
        { provide: Dialog, useValue: { open } },
      ],
    });
    const fixture = TestBed.createComponent(NotificationBell);
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('starts the stream, shows the unread count in the accessible name and opens the panel', async () => {
    const { fixture, element } = setup();
    unread.set(3);
    await fixture.whenStable();
    expect(start).toHaveBeenCalled();
    const button = element.querySelector('button');
    expect(button?.getAttribute('aria-label')).toContain('3');
    expect(element.textContent).toContain('3');
    button?.click();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('stops the stream on destroy', () => {
    const { fixture } = setup();
    fixture.destroy();
    expect(stop).toHaveBeenCalled();
  });
});
