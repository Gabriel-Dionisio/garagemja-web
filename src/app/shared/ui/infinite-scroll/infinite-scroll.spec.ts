import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InfiniteScroll } from './infinite-scroll';

@Component({
  imports: [InfiniteScroll],
  template: `<div appInfiniteScroll (reached)="count = count + 1"></div>`,
})
class Host {
  count = 0;
}

describe('InfiniteScroll', () => {
  let callback: IntersectionObserverCallback;
  const disconnect = vi.fn();

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const fire = (isIntersecting: boolean) =>
    callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);

  it('emits only when the sentinel becomes visible and disconnects on destroy', () => {
    const fixture = TestBed.createComponent(Host);
    fire(false);
    expect(fixture.componentInstance.count).toBe(0);
    fire(true);
    expect(fixture.componentInstance.count).toBe(1);
    fixture.destroy();
    expect(disconnect).toHaveBeenCalled();
  });
});
