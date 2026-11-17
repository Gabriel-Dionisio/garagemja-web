import { DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

@Directive({ selector: '[appInfiniteScroll]' })
export class InfiniteScroll {
  readonly reached = output<void>();

  constructor() {
    if (typeof IntersectionObserver === 'undefined') return;
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.reached.emit();
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
