import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconButton } from '../icon-button/icon-button';

export interface CarouselImage {
  id: string;
  url: string;
}

const SWIPE_DISTANCE = 40;

@Component({
  selector: 'app-carousel',
  imports: [TranslocoPipe, Icon, IconButton],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carousel {
  readonly images = input.required<readonly CarouselImage[]>();
  readonly label = input.required<string>();
  readonly placeholder = input.required<string>();

  protected readonly index = linkedSignal<readonly CarouselImage[], number>({
    source: this.images,
    computation: () => 0,
  });
  protected readonly current = computed(
    () => this.images()[this.index()]?.url ?? this.placeholder(),
  );
  protected readonly multiple = computed(() => this.images().length > 1);
  private swipeStart: number | null = null;

  protected step(delta: number): void {
    const total = this.images().length;
    this.index.update((value) => (value + delta + total) % total);
  }

  protected onKey(event: KeyboardEvent): void {
    if (!this.multiple()) return;
    if (event.key === 'ArrowLeft') this.step(-1);
    else if (event.key === 'ArrowRight') this.step(1);
    else return;
    event.preventDefault();
  }

  protected onPointerDown(event: PointerEvent): void {
    this.swipeStart = event.clientX;
  }

  protected onPointerCancel(): void {
    this.swipeStart = null;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.swipeStart === null || !this.multiple()) return;
    const delta = event.clientX - this.swipeStart;
    this.swipeStart = null;
    if (Math.abs(delta) >= SWIPE_DISTANCE) this.step(delta < 0 ? 1 : -1);
  }
}
