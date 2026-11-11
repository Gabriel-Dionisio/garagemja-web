import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconButton } from '../icon-button/icon-button';
import { Icon } from '../icon/icon';

export const PAGE_SIZES: readonly number[] = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

@Component({
  selector: 'app-paginator',
  imports: [TranslocoPipe, IconButton, Icon],
  templateUrl: './paginator.html',
  styleUrl: './paginator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Paginator {
  readonly page = input.required<number>();
  readonly hasNext = input.required<boolean>();
  readonly size = input(0);
  readonly total = input<number | undefined>(undefined);
  readonly itemCount = input(0);
  readonly sizeOptions = input<readonly number[]>([]);
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  protected pickSize(event: Event): void {
    this.sizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }

  protected readonly hasPrevious = computed(() => this.page() > 0);
  protected readonly range = computed(() => {
    const count = this.itemCount();
    if (count === 0) return null;
    const from = this.page() * this.size() + 1;
    return { from, to: from + count - 1, total: this.total() };
  });
}
