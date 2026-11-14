import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  function create(inputs: Record<string, unknown>) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('label', 'Ganhos');
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a text value with its label', () => {
    const element = create({ value: 'R$ 10,00' }).nativeElement as HTMLElement;
    expect(element.textContent).toContain('R$ 10,00');
    expect(element.textContent).toContain('Ganhos');
  });

  it('emits selected when selectable and clicked', () => {
    const fixture = create({ value: 3, selectable: true });
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    fixture.nativeElement.querySelector('button').click();
    expect(selected).toHaveBeenCalled();
  });

  it('renders a link when link is set', () => {
    const element = create({ value: 3, link: '/x' }).nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/x"]')).not.toBeNull();
  });
});
