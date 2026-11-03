import { TranslocoPipe } from '@jsverse/transloco';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from '../button/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  params?: Record<string, string>;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [TranslocoPipe, Button],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  private readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected close(confirmed: boolean): void {
    this.ref.close(confirmed);
  }
}
