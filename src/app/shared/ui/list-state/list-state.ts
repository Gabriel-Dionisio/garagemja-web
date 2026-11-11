import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Alert } from '../alert/alert';
import { EmptyState } from '../empty-state/empty-state';
import { IconName } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  selector: 'app-list-state',
  imports: [Alert, EmptyState, Skeleton],
  templateUrl: './list-state.html',
  styleUrl: './list-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListState {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly empty = input(false);
  readonly loadingLabel = input('');
  readonly emptyTitle = input('');
  readonly emptyDescription = input('');
  readonly emptyIcon = input<IconName>('info');
  readonly rows = input(4);
  readonly rowHeight = input('4.5rem');
  readonly listLabel = input<string | null>(null);
}
