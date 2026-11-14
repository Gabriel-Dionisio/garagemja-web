import {
  ChangeDetectionStrategy,
  Component,
  computed,
  booleanAttribute,
  contentChildren,
  input,
} from '@angular/core';
import { ListState } from '../list-state/list-state';
import { ScrollArea } from '../scroll-area/scroll-area';

export type PageSize = 'narrow' | 'form' | 'wide' | 'full';

@Component({
  selector: 'app-page',
  imports: [ScrollArea],
  template:
    '<app-scroll-area class="viewport"><div class="content"><ng-content /></div></app-scroll-area>',
  styleUrl: './page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-size]': 'size()', '[class.fill]': 'fill()' },
})
export class Page {
  readonly size = input<PageSize>('full');
  readonly fillContent = input(false, { alias: 'fill', transform: booleanAttribute });
  private readonly lists = contentChildren(ListState);
  protected readonly fill = computed(() => this.fillContent() || this.lists().length === 1);
}
