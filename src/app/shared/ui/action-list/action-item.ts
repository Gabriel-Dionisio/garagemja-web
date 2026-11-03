import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'button[appActionItem]',
  imports: [Icon],
  template: '<app-icon [name]="icon()" /><ng-content />',
  styleUrl: './action-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { type: 'button', '[attr.data-variant]': 'variant()' },
})
export class ActionItem {
  readonly icon = input.required<IconName>();
  readonly variant = input<'default' | 'danger'>('default');
}
