import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Spinner } from '../spinner/spinner';

@Component({
  selector: 'app-loading-block',
  imports: [Spinner],
  template: '<app-spinner /> {{ label() }}',
  styleUrl: './loading-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status' },
})
export class LoadingBlock {
  readonly label = input.required<string>();
}
