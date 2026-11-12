import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'app-icon-label',
  imports: [Icon],
  template: '<app-icon [name]="icon()" /><span><ng-content /></span>',
  styleUrl: './icon-label.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconLabel {
  readonly icon = input.required<IconName>();
}
