import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Avatar } from '../avatar/avatar';

@Component({
  selector: 'app-user-summary',
  imports: [Avatar],
  templateUrl: './user-summary.html',
  styleUrl: './user-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSummary {
  readonly name = input.required<string>();
  readonly email = input.required<string>();
  readonly caption = input('');
  readonly photoUrl = input<string | null>(null);
}
