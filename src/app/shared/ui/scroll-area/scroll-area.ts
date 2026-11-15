import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';

export type ScrollOrientation = 'vertical' | 'horizontal' | 'both';

export interface ScrollEdges {
  left: boolean;
  right: boolean;
}

const NO_OVERFLOW: ScrollEdges = { left: false, right: false };
const EDGE_TOLERANCE_PX = 1;
const STEP_RATIO = 0.8;
const LINE_HEIGHT_PX = 16;

export function readEdges(el: HTMLElement): ScrollEdges {
  const maxX = el.scrollWidth - el.clientWidth;
  return {
    left: el.scrollLeft > EDGE_TOLERANCE_PX,
    right: el.scrollLeft < maxX - EDGE_TOLERANCE_PX,
  };
}

export function wheelToHorizontal(event: WheelEvent, el: HTMLElement): number {
  if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return 0;
  if (el.scrollHeight - el.clientHeight > EDGE_TOLERANCE_PX) return 0;
  const scale =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? LINE_HEIGHT_PX
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? el.clientWidth
        : 1;
  const maxX = el.scrollWidth - el.clientWidth;
  const next = Math.min(Math.max(el.scrollLeft + event.deltaY * scale, 0), maxX);
  return next - el.scrollLeft;
}

function sameEdges(a: ScrollEdges, b: ScrollEdges): boolean {
  return a.left === b.left && a.right === b.right;
}

@Component({
  selector: 'app-scroll-area',
  imports: [Icon],
  templateUrl: './scroll-area.html',
  styleUrl: './scroll-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-orientation]': 'orientation()',
    '[class.more-left]': 'edges().left',
    '[class.more-right]': 'edges().right',
  },
})
export class ScrollArea {
  readonly orientation = input<ScrollOrientation>('vertical');

  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  protected readonly edges = signal(NO_OVERFLOW, { equal: sameEdges });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (this.orientation() === 'vertical') return;
      const el = this.viewport().nativeElement;
      this.update();
      if (typeof ResizeObserver === 'undefined') return;
      const resize = new ResizeObserver(() => this.update());
      const observeChildren = () => {
        resize.disconnect();
        resize.observe(el);
        for (const child of Array.from(el.children)) resize.observe(child);
      };
      const mutations = new MutationObserver(() => {
        observeChildren();
        this.update();
      });
      observeChildren();
      mutations.observe(el, { childList: true, subtree: true });
      destroyRef.onDestroy(() => {
        resize.disconnect();
        mutations.disconnect();
      });
    });
  }

  protected update(): void {
    if (this.orientation() === 'vertical') return;
    this.edges.set(readEdges(this.viewport().nativeElement));
  }

  protected onWheel(event: WheelEvent): void {
    if (this.orientation() === 'vertical') return;
    const el = this.viewport().nativeElement;
    const delta = wheelToHorizontal(event, el);
    if (delta === 0) return;
    event.preventDefault();
    el.scrollBy({ left: delta, behavior: 'auto' });
  }

  protected step(direction: 1 | -1): void {
    const el = this.viewport().nativeElement;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: direction * el.clientWidth * STEP_RATIO,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }
}
