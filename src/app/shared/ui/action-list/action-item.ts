import { ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

@Component({
  selector: 'button[appActionItem], a[appActionItem]',
  imports: [Icon],
  template: '<app-icon [name]="icon()" /><ng-content />',
  styleUrl: './action-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.type]': 'isButton ? "button" : null', '[attr.data-variant]': 'variant()' },
})
export class ActionItem {
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'BUTTON';
  readonly icon = input.required<IconName>();
  readonly variant = input<'default' | 'danger'>('default');
}
