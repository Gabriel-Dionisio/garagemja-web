import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Page } from './page';

@Component({
  imports: [Page],
  template: `<app-page size="narrow" [fill]="true"><p>conteúdo</p></app-page>`,
})
class Host {}

describe('Page', () => {
  it('projects the content and exposes size and fill', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement.querySelector('app-page');
    expect(page.textContent).toContain('conteúdo');
    expect(page.getAttribute('data-size')).toBe('narrow');
    expect(page.classList.contains('fill')).toBe(true);
  });
});
