import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollArea, readEdges, wheelToHorizontal } from './scroll-area';

function box(size: Partial<HTMLElement>): HTMLElement {
  return {
    scrollWidth: 100,
    clientWidth: 100,
    scrollHeight: 100,
    clientHeight: 100,
    scrollLeft: 0,
    scrollTop: 0,
    ...size,
  } as HTMLElement;
}

function wheel(init: WheelEventInit): WheelEvent {
  return new WheelEvent('wheel', init);
}

@Component({
  imports: [ScrollArea],
  template: `<app-scroll-area orientation="horizontal"><p>conteúdo</p></app-scroll-area>`,
})
class Host {}

describe('readEdges', () => {
  it('reports hidden content on each horizontal side', () => {
    expect(readEdges(box({ scrollWidth: 300, scrollLeft: 50 }))).toEqual({
      left: true,
      right: true,
    });
    expect(readEdges(box({ scrollWidth: 300 }))).toEqual({ left: false, right: true });
    expect(readEdges(box({}))).toEqual({ left: false, right: false });
  });

  it('treats sub-pixel leftovers at the end as no overflow', () => {
    expect(readEdges(box({ scrollWidth: 300, scrollLeft: 199.5 })).right).toBe(false);
  });
});

describe('wheelToHorizontal', () => {
  const wide = () => box({ scrollWidth: 300, scrollLeft: 100 });

  it('turns a vertical wheel into horizontal scroll when only x overflows', () => {
    expect(wheelToHorizontal(wheel({ deltaY: 40 }), wide())).toBe(40);
    expect(wheelToHorizontal(wheel({ deltaY: -40 }), wide())).toBe(-40);
  });

  it('scales line and page deltas', () => {
    expect(wheelToHorizontal(wheel({ deltaY: 3, deltaMode: 1 }), wide())).toBe(48);
    expect(wheelToHorizontal(wheel({ deltaY: -1, deltaMode: 2 }), wide())).toBe(-100);
  });

  it('stops at the edges so the surrounding page can scroll', () => {
    expect(wheelToHorizontal(wheel({ deltaY: 500 }), wide())).toBe(100);
    expect(
      wheelToHorizontal(wheel({ deltaY: 40 }), box({ scrollWidth: 300, scrollLeft: 200 })),
    ).toBe(0);
  });

  it('leaves native gestures alone', () => {
    expect(wheelToHorizontal(wheel({ deltaY: 40, shiftKey: true }), wide())).toBe(0);
    expect(wheelToHorizontal(wheel({ deltaY: 40, ctrlKey: true }), wide())).toBe(0);
    expect(wheelToHorizontal(wheel({ deltaX: 40, deltaY: 10 }), wide())).toBe(0);
    expect(wheelToHorizontal(wheel({ deltaY: 40 }), box({ ...wide(), scrollHeight: 300 }))).toBe(0);
  });
});

describe('ScrollArea', () => {
  it('projects content and exposes the orientation without arrows when nothing overflows', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const area: HTMLElement = fixture.nativeElement.querySelector('app-scroll-area');
    expect(area.querySelector('.viewport')?.textContent).toContain('conteúdo');
    expect(area.getAttribute('data-orientation')).toBe('horizontal');
    expect(area.querySelector('.arrow')).toBeNull();
  });
});
