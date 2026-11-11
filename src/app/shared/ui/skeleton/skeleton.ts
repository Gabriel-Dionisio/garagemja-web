import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SkeletonBlock } from './skeleton-block';

@Component({
  selector: 'app-skeleton',
  imports: [SkeletonBlock],
  template: `
    <span class="sr-only">{{ label() }}</span>
    <div class="shapes" aria-hidden="true">
      @for (row of rowList(); track row) {
        <app-skeleton-block [height]="rowHeight()" />
      }
      <ng-content />
    </div>
  `,
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-busy': 'true' },
})
export class Skeleton {
  readonly label = input.required<string>();
  readonly rows = input(0);
  readonly rowHeight = input('3rem');

  protected readonly rowList = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
