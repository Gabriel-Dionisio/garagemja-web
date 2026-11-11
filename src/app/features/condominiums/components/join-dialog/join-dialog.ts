import { TranslocoPipe } from '@jsverse/transloco';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '../../../../shared/ui/button/button';
import { JoinMode, JoinPanel } from '../join-panel/join-panel';

export interface JoinDialogData {
  mode?: JoinMode;
  code?: string;
  cnpj?: string;
}

@Component({
  selector: 'app-join-dialog',
  imports: [TranslocoPipe, Button, JoinPanel],
  templateUrl: './join-dialog.html',
  styleUrl: './join-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinDialog {
  protected readonly data = inject<JoinDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
