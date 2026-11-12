import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch {
  readonly label = input.required<string>();
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly toggled = output<boolean>();
}
