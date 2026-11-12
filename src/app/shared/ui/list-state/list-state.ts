import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { Alert } from '../alert/alert';
import { EmptyState } from '../empty-state/empty-state';
import { IconName } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

const REFRESH_SKELETON_DELAY_MS = 300;

@Component({
  selector: 'app-list-state',
  imports: [Alert, EmptyState, Skeleton],
  templateUrl: './list-state.html',
  styleUrl: './list-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListState {
  readonly loading = input(false);
  readonly refreshing = input(false);
  readonly error = input<string | null>(null);
  readonly empty = input(false);
  readonly loadingLabel = input('');
  readonly emptyTitle = input('');
  readonly emptyDescription = input('');
  readonly emptyIcon = input<IconName>('info');
  readonly rows = input(4);
  readonly rowHeight = input('4.5rem');
  readonly listLabel = input<string | null>(null);

  protected readonly slowRefresh = signal(false);

  constructor() {
    effect((onCleanup) => {
      if (!this.refreshing()) {
        this.slowRefresh.set(false);
        return;
      }
      const timer = setTimeout(() => this.slowRefresh.set(true), REFRESH_SKELETON_DELAY_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
