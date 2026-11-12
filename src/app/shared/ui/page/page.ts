import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
} from '@angular/core';
import { ListState } from '../list-state/list-state';

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
  private readonly lists = contentChildren(ListState);
  protected readonly fill = computed(() => this.lists().length === 1);
}
