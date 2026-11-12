import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

@Component({
  selector: 'app-filter-panel',
  imports: [Icon],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanel {
  readonly label = input.required<string>();
  readonly activeCount = input(0);
  readonly open = model(false);

  protected readonly panelId = `filter-panel-${nextId++}`;
}
