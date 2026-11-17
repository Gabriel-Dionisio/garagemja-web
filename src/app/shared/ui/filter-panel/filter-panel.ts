import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../icon/icon';
import { IconButton } from '../icon-button/icon-button';

let nextId = 0;

@Component({
  host: { '[class.overlay]': 'overlay()' },
  selector: 'app-filter-panel',
  imports: [A11yModule, TranslocoPipe, Icon, IconButton],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanel {
  readonly label = input.required<string>();
  readonly activeCount = input(0);
  readonly open = model(false);
  readonly overlay = input(false);

  protected readonly panelId = `filter-panel-${nextId++}`;
}
