import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActionList } from '../action-list/action-list';
import { Icon } from '../icon/icon';
import { IconButton } from '../icon-button/icon-button';

@Component({
  selector: 'app-fab',
  imports: [ActionList, Icon, IconButton],
  template: `
    @if (open()) {
      <app-action-list class="menu" [label]="label()" (click)="open.set(false)">
        <ng-content />
      </app-action-list>
    }
    <button
      appIconButton
      variant="fab"
      type="button"
      aria-haspopup="true"
      [label]="label()"
      [attr.aria-expanded]="open()"
      (click)="open.set(!open())"
    >
      <app-icon name="plus" />
    </button>
  `,
  styleUrl: './fab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeOutside($event)',
    '(document:keydown.escape)': 'open.set(false)',
  },
})
export class Fab {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly label = input.required<string>();
  protected readonly open = signal(false);

  protected closeOutside(event: Event) {
    if (!this.host.contains(event.target as Node)) this.open.set(false);
  }
}
