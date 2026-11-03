import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-brand-logo',
  imports: [Icon],
  templateUrl: './brand-logo.html',
  styleUrl: './brand-logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-compact]': 'compact() ? "" : null',
    '[attr.data-stacked]': 'stacked() ? "" : null',
    '[attr.data-inline-mobile]': 'inlineOnMobile() ? "" : null',
  },
})
export class BrandLogo {
  readonly compact = input(false);
  readonly stacked = input(false);
  readonly inlineOnMobile = input(false);
}
