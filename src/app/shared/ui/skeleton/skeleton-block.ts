import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton-block',
  template: '',
  styleUrl: './skeleton-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
})
export class SkeletonBlock {
  readonly width = input('100%');
  readonly height = input('1rem');
}
