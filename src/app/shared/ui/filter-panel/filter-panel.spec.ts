import { TestBed } from '@angular/core/testing';
import { FilterPanel } from './filter-panel';

describe('FilterPanel', () => {
  async function setup(overlay: boolean) {
    const fixture = TestBed.createComponent(FilterPanel);
    fixture.componentRef.setInput('label', 'Filtros');
    fixture.componentRef.setInput('overlay', overlay);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector<HTMLButtonElement>('.toggle');
    toggle?.click();
    await fixture.whenStable();
    return { fixture, element, toggle };
  }

  it('opens inline without dialog semantics', async () => {
    const { element, toggle } = await setup(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.panel')?.getAttribute('role')).toBeNull();
    expect(element.querySelector('.backdrop')).toBeNull();
  });

  it('opens as a modal dialog and closes by the close button, backdrop or Escape', async () => {
    const { fixture, element, toggle } = await setup(true);
    const panel = element.querySelector('.panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-label')).toBe('Filtros');

    panel.querySelector<HTMLButtonElement>('header button')?.click();
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);

    toggle?.click();
    await fixture.whenStable();
    element.querySelector<HTMLElement>('.backdrop')?.click();
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);

    toggle?.click();
    await fixture.whenStable();
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(panel.hidden).toBe(true);
  });
});
