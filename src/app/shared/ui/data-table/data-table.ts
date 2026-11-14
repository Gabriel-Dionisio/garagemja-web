import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ScrollArea } from '../scroll-area/scroll-area';

@Component({
  selector: 'app-data-table',
  imports: [ScrollArea],
  template: '<app-scroll-area orientation="horizontal"><ng-content /></app-scroll-area>',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DataTable {}
