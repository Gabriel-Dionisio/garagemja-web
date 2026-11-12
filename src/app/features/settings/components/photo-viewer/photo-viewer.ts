import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../../shared/ui/icon/icon';

@Component({
  selector: 'app-photo-viewer',
  imports: [TranslocoPipe, Icon],
  templateUrl: './photo-viewer.html',
  styleUrl: './photo-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoViewer {
  protected readonly data = inject<{ src: string; name: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<void>>(DialogRef);
}
