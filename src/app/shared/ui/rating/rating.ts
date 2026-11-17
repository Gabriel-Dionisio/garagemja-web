import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-rating',
  imports: [TranslocoPipe, Icon],
  templateUrl: './rating.html',
  styleUrl: './rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rating {
  readonly average = input<number | null>(null);
  readonly total = input(0);
}
