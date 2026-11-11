import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TabNav } from './tab-nav';

describe('TabNav', () => {
  it('renderiza um link por aba com o nome acessível', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TabNav);
    fixture.componentRef.setInput('label', 'Seções');
    fixture.componentRef.setInput('tabs', [
      { link: '/a', label: 'A', exact: true },
      { link: ['/a', 'b'], label: 'B' },
    ]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Seções');
    expect([...root.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      '/a',
      '/a/b',
    ]);
  });
});
