import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconButton } from '../icon-button/icon-button';
import { Icon } from '../icon/icon';

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
  readonly pageChange = output<number>();

  protected readonly hasPrevious = computed(() => this.page() > 0);
  protected readonly range = computed(() => {
    const count = this.itemCount();
    if (count === 0) return null;
    const from = this.page() * this.size() + 1;
    return { from, to: from + count - 1, total: this.total() };
  });
}
