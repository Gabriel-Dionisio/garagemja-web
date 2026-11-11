import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PageSize = 'narrow' | 'form' | 'wide' | 'full';

@Component({
  selector: 'app-page',
  template: '<ng-content />',
  styleUrl: './page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-size]': 'size()', '[class.fill]': 'fill()' },
})
export class Page {
  readonly size = input<PageSize>('full');
  readonly fill = input(false);
}
