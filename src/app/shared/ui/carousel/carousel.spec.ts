import { TestBed } from '@angular/core/testing';
import { Carousel } from './carousel';

describe('Carousel', () => {
  function setup(images: { id: string; url: string }[]) {
    const fixture = TestBed.createComponent(Carousel);
    fixture.componentRef.setInput('images', images);
    fixture.componentRef.setInput('label', 'Fotos');
    fixture.componentRef.setInput('placeholder', '/placeholder.svg');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const src = () => el.querySelector('.main')?.getAttribute('src');
    return { fixture, el, src };
  }

  const images = [
    { id: 'a', url: '/a.jpg' },
    { id: 'b', url: '/b.jpg' },
    { id: 'c', url: '/c.jpg' },
  ];

  it('shows the placeholder without controls when there are no images', () => {
    const { el, src } = setup([]);
    expect(src()).toBe('/placeholder.svg');
    expect(el.querySelector('.nav')).toBeNull();
  });

  it('has an accessible name and steps with buttons, wrapping around', () => {
    const { fixture, el, src } = setup(images);
    expect(el.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Fotos');
    el.querySelector<HTMLButtonElement>('.prev')!.click();
    fixture.detectChanges();
    expect(src()).toBe('/c.jpg');
    el.querySelector<HTMLButtonElement>('.next')!.click();
    fixture.detectChanges();
    expect(src()).toBe('/a.jpg');
  });

  it('navigates by keyboard, thumbnail and swipe', () => {
    const { fixture, el, src } = setup(images);
    el.querySelector('.carousel')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight' }),
    );
    fixture.detectChanges();
    expect(src()).toBe('/b.jpg');
    el.querySelectorAll<HTMLButtonElement>('.thumbs button')[2].click();
    fixture.detectChanges();
    expect(src()).toBe('/c.jpg');
    const stage = el.querySelector('.stage')!;
    stage.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200 }));
    stage.dispatchEvent(new PointerEvent('pointerup', { clientX: 100 }));
    fixture.detectChanges();
    expect(src()).toBe('/a.jpg');
  });
});
