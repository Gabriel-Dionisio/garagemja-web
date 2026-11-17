import { TestBed } from '@angular/core/testing';
import { SpotFeatures } from './spot-features';

describe('SpotFeatures', () => {
  function render(size: 'SMALL' | null, covered: boolean) {
    const fixture = TestBed.createComponent(SpotFeatures);
    fixture.componentRef.setInput('spot', { size, covered });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows size and a roof chip for covered spots', () => {
    const el = render('SMALL', true);
    expect(el.querySelectorAll('app-badge')).toHaveLength(2);
    expect(el.querySelectorAll('app-icon')).toHaveLength(2);
    expect(el.querySelector('.size')).not.toBeNull();
  });

  it('shows only the sun chip for uncovered spots without size', () => {
    const el = render(null, false);
    expect(el.querySelectorAll('app-badge')).toHaveLength(1);
    expect(el.querySelector('.size')).toBeNull();
  });
});
