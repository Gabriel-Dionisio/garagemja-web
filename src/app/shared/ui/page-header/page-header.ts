import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../icon/icon';
import { IconButton } from '../icon-button/icon-button';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink, TranslocoPipe, Icon, IconButton],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly backLink = input<string | null>(null);
}
