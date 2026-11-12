import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ListItem } from './list-item';

@Component({
  imports: [ListItem],
  template: `<ul>
    <li appListItem [link]="['/condominiums', 'c1']" [queryParams]="{ status: 'PENDING' }">
      <span leading>L</span>Nome<span status>S</span><span actions>A</span>
    </li>
    <li appListItem>Sem link</li>
  </ul>`,
})
class Host {}

describe('ListItem', () => {
  it('links the main area and projects the slots', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [first, second] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('li'));
    const link = first.querySelector('a.main');
    expect(link?.getAttribute('href')).toBe('/condominiums/c1?status=PENDING');
    expect(link?.textContent).toContain('Nome');
    expect(first.querySelector('.status')?.textContent).toBe('S');
    expect(first.querySelector('.actions')?.textContent).toBe('A');
    expect(second.querySelector('a')).toBeNull();
    expect(second.querySelector('.main')?.textContent).toContain('Sem link');
  });
});
