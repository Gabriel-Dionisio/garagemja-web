import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-chip-toggle',
  imports: [Icon],
  templateUrl: './chip-toggle.html',
  styleUrl: './chip-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipToggle {
  readonly label = input.required<string>();
  readonly pressed = input(false);
  readonly toggled = output<void>();
}
