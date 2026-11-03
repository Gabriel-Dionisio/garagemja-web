import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-auth-panel',
  templateUrl: './auth-panel.html',
  styleUrl: './auth-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPanel {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
  protected readonly titleId = `auth-panel-title-${nextId++}`;
}
