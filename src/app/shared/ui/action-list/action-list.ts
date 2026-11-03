import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-action-list',
  template: '<ng-content />',
  styleUrl: './action-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': 'label() || null' },
})
export class ActionList {
  readonly label = input('');
}
