import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../shared/ui/icon/icon';
import { IconButton } from '../../../shared/ui/icon-button/icon-button';

@Component({
  selector: 'app-topbar-search',
  imports: [TranslocoPipe, Icon, IconButton],
  templateUrl: './topbar-search.html',
  styleUrl: './topbar-search.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'topbar-search' },
})
export class TopbarSearch {}
