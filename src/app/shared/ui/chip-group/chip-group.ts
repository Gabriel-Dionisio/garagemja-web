import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

export interface ChipOption<T extends string = string> {
  value: T | null;
  labelKey: string;
}

@Component({
  selector: 'app-chip-group',
  imports: [TranslocoPipe],
  templateUrl: './chip-group.html',
  styleUrl: './chip-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': 'label()' },
})
export class ChipGroup<T extends string = string> {
  readonly label = input.required<string>();
  readonly options = input.required<readonly ChipOption<T>[]>();
  readonly value = input<T | null>(null);
  readonly valueChange = output<T | null>();
}
