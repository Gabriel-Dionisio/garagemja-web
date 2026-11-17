import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon, IconName } from '../icon/icon';
import { ScrollArea } from '../scroll-area/scroll-area';

export interface ChipOption<T extends string = string> {
  value: T | null;
  labelKey?: string;
  label?: string;
  icon?: IconName;
}

@Component({
  selector: 'app-chip-group',
  imports: [Icon, ScrollArea, TranslocoPipe],
  templateUrl: './chip-group.html',
  styleUrl: './chip-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', '[attr.aria-label]': 'label()' },
})
export class ChipGroup<T extends string = string> {
  readonly label = input.required<string>();
  readonly showLabel = input(false);
  readonly options = input.required<readonly ChipOption<T>[]>();
  readonly value = input<T | null>(null);
  readonly valueChange = output<T | null>();
}
