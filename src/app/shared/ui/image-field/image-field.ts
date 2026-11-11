import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconLabel } from '../icon-label/icon-label';

export interface ImageItem {
  id: string;
  url: string;
}

@Component({
  selector: 'app-image-field',
  imports: [TranslocoPipe, Icon, IconLabel],
  templateUrl: './image-field.html',
  styleUrl: './image-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageField {
  readonly images = input<readonly ImageItem[]>([]);
  readonly alt = input('');
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly multiple = input(true);
  readonly max = input(Number.POSITIVE_INFINITY);
  readonly maxBytes = input(5 * 1024 * 1024);

  readonly selected = output<File>();
  readonly removed = output<string>();
  readonly moved = output<{ id: string; step: -1 | 1 }>();

  protected readonly infinity = Number.POSITIVE_INFINITY;
  protected readonly rejected = signal<'type' | 'size' | null>(null);
  private readonly requested = signal(0);

  protected readonly canAdd = computed(
    () =>
      !this.disabled() &&
      (this.multiple() || this.images().length === 0) &&
      this.images().length < this.max(),
  );
  protected readonly total = computed(() => this.images().length + (this.canAdd() ? 1 : 0));
  protected readonly position = computed(() =>
    Math.max(0, Math.min(this.requested(), this.total() - 1)),
  );
  protected readonly current = computed(() => this.images()[this.position()] ?? null);

  protected go(step: number): void {
    this.requested.set((this.position() + step + this.total()) % this.total());
  }

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.rejected.set(null);
    for (const file of files.slice(0, Math.max(0, this.max() - this.images().length))) {
      if (!file.type.startsWith('image/')) this.rejected.set('type');
      else if (file.size > this.maxBytes()) this.rejected.set('size');
      else this.selected.emit(file);
    }
  }
}
