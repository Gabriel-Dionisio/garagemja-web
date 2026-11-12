import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ListState } from '../list-state/list-state';
import { Page } from './page';

@Component({
  imports: [Page],
  template: `<app-page size="narrow"><p>conteúdo</p></app-page>`,
})
class PlainHost {}

@Component({
  imports: [Page, ListState],
  template: `<app-page>
    @if (show()) {
      <app-list-state />
    }
  </app-page>`,
})
class ListHost {
  readonly show = signal(true);
}

@Component({
  imports: [Page, ListState],
  template: `<app-page><app-list-state /><app-list-state /></app-page>`,
})
class TwoListsHost {}

describe('Page', () => {
  it('projects the content and exposes size without filling', async () => {
    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement.querySelector('app-page');
    expect(page.textContent).toContain('conteúdo');
    expect(page.getAttribute('data-size')).toBe('narrow');
    expect(page.classList.contains('fill')).toBe(false);
  });

  it('fills the viewport automatically when it holds a list state', async () => {
    const fixture = TestBed.createComponent(ListHost);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement.querySelector('app-page');
    expect(page.classList.contains('fill')).toBe(true);
    fixture.componentInstance.show.set(false);
    await fixture.whenStable();
    expect(page.classList.contains('fill')).toBe(false);
  });

  it('scrolls as a whole when it holds more than one list state', async () => {
    const fixture = TestBed.createComponent(TwoListsHost);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-page').classList.contains('fill')).toBe(false);
  });
});
